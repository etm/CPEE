#!/usr/bin/ruby
require 'pp'
require 'json'
require 'rubygems'
require 'riddl/server'
require 'riddl/client'
require 'riddl/utils/notifications_producer'
require 'riddl/utils/properties'
require 'riddl/utils/fileserve'
require 'riddl/utils/downloadify'
require 'riddl/utils/turtle'
require 'time'

class Logging < Riddl::Implementation #{{{
  def doc(event_name,log_dir,instancenr,notification)
    uuid = notification['instance_uuid']
    activity = notification["activity"]
    parameters = notification['parameters']
    receiving = notification['received']
    Dir.mkdir(log_dir+'/'+uuid) unless Dir.exist?(log_dir+'/'+uuid)
    time_added=false
    cpee_time =  notification['time']
    XML::Smart.modify(log_dir+'/'+uuid+'/log.xes',LOGTEMPLATE) do |xml|
      begin
        trace = xml.find("/xmlns:log/xmlns:trace").first
        trace.add 'string', :key => "concept:name", :value => "Instance #{instancenr}" if trace.find('xmlns:string').empty?
        event = trace.add "event"
        if parameters && parameters.has_key?('label')
          event.add 'string', :key => "concept:name", :value => parameters["label"]
        else
          event.add 'string', :key => "concept:name", :value => trace.find("string(xmlns:event[xmlns:string[@key='id:id' and @value='#{activity}']]/xmlns:string[@key='concept:name']/@value)")
        end
        event.add 'string', :key => "concept:endpoint", :value => notification["endpoint"] if notification["endpoint"]
        event.add 'string', :key => "id:id", :value => activity
        unless event_name=='receiving'
          event.add 'string', :key => "lifecycle:transition", :value => event_name=='done'?"complete":"start"
        else
          event.add 'string', :key => "lifecycle:transition", :value => "unknown"
        end
        data_send = ((parameters["arguments"].nil? ? [] : parameters["arguments"]) rescue [])
        if data_send && data_send.any?
          list = event.add 'list', :key => "data_send"
          data_send.each do |e|
            list.add 'string', :key => e['name'] , :value => e['value']
          end
        end
        if receiving && receiving.any?
          if receiving.is_a? Array
            receiving.each do |e|
              e.each do |k,v|
                case v['mimetype']
                  when /\/xml$/
          					list = event.add 'list', :key => "data_received"
                    node = list.add 'string', :key => k
                    node.add XML::Smart.string(v['content']).root
                  when /\/json$/
                    rec_unjson(JSON.parse(v['content']),event,"data_received")
                  when /\/html$/
          					list = event.add 'list', :key => "data_received"
                    list.add 'string', :key => k, :value => v['content']
                  else
          					list = event.add 'list', :key => "data_received"
                    list.add 'string', :key => k, :value => v
                end
              end
            end
          else
            pp receiving
          end
        end
        event.add 'date', :key => "time:timestamp", :value => cpee_time unless time_added
        pid, size = `ps ax -o pid,rss | grep -E "^[[:space:]]*#{$$}"`.strip.split.map(&:to_i)
        File.open(log_dir+'/'+uuid+'/memory.file',"a+"){ |f| f<< size << "\n" }
      rescue => e
        puts e.message
        puts e.backtrace
      end
    end
  end

	def rec_unjson(value,list,key)
		case value
			when Array then
				li = list.add 'list', :key => key
				value.each_with_index do |v,k|
					rec_unjson(v,li,k)
				end
			when Hash then
				li = list.add 'list', :key => key
				value.each do |k,v|
					rec_unjson(v,li,k)
				end
			else
				list.add 'string', :key => key, :value => value
		end
	end

  def response
    topic = @p[1].value
    event_name = @p[2].value
    log_dir = @a[0]
    instancenr = @h['CPEE_INSTANCE_URL'].split('/').last
    notification = JSON.parse(@p[3].value)
    doc(event_name,log_dir,instancenr,notification)
  end
end  #}}}


Riddl::Server.new(File.join(__dir__,'/log.xml'), :host => 'localhost', :port => 9299) do #{{{
  accessible_description true
  cross_site_xhr true
  @riddllog_dir = File.join(__dir__,logs)"

  interface 'events' do
	  run Logging if post 'event'
  end
  interface 'logoverlay' do |r|
    run Riddl::Utils::FileServe, log_dir + r[:h]["RIDDL_DECLARATION_PATH"]+ ".xes","text/xml" if get
  end

end.loop! #}}}
