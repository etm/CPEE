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
  LOGTEMPLATE = <<-END
    <log xmlns="http://www.xes-standard.org/" xes.version="2.0" xes.features="nested-attributes">
      <extension name="Time" prefix="time" uri="http://www.xes-standard.org/time.xesext"/>
      <extension name="Concept" prefix="concept" uri="http://www.xes-standard.org/concept.xesext"/>
      <extension name="Organizational" prefix="org" uri="http://www.xes-standard.org/org.xesext"/>
	    <extension name="Lifecycle" prefix="lifecycle" uri="http://www.xes-standard.org/lifecycle.xesext"/>
      <global scope="trace">                                                                                                                                          
        <string key="concept:name" value="__INVALID__"/>
      </global>
      <global scope="event">
        <string key="concept:name" value="__INVALID__"/>
        <string key="concept:endpoint" value="__ENDPOINT__"/>
        <string key="id:id" value="__ID__"/>
        <string key="lifecycle:transition" value="complete" />
        <date key="time:timestamp" value="1990-02-17T09:45:00.000+01:00"/>
      </global>
			<classifier name="Data" keys="data_send data_received"/>
			<classifier name="Data_Received" keys="data_received"/>
			<classifier name="Name" keys="concept:name"/>
			<classifier name="Endpoint" keys="concept:endpoint"/>
			<classifier name="ID" keys="id:id"/>
			<classifier name="Lifecycle" keys="lifecycle:transition"/>
      <trace/>
    </log>
  END
  def doc(event_name,log_dir,instancenr,notification)
    start_x = Time.now
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
    end_x = Time.now
    x = end_x - start_x
    File.open(log_dir+'/'+uuid+'/time.file',"a+"){ |f| f<< x << "\n" }
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
    log_dir = ::File.dirname(__FILE__) + "/logs"
    instancenr = @h['CPEE_INSTANCE'].split('/').last
    notification = JSON.parse(@p[3].value)
    doc(event_name,log_dir,instancenr,notification)
  end
end  #}}}


Riddl::Server.new(::File.dirname(__FILE__) + '/log.xml', :host => "coruscant.wst.univie.ac.at", :port => 9299) do #{{{
  accessible_description true
  cross_site_xhr true
  log_path = "/home/demo/Projects/cpee-helpers/log/logs"

  interface 'events' do 
	    run Logging if post 'event'
	    #run CB if post 'vote'
  end
  interface 'logoverlay' do |r|
    run Riddl::Utils::FileServe, "#{log_path}#{r[:h]["RIDDL_DECLARATION_PATH"]}.xes","text/xml" if get '*'
  end


end.loop! #}}}
