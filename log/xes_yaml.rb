#!/usr/bin/ruby
require 'pp'
require 'json'
require 'yaml'
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
  def doc(event_name,log_dir,template,instancenr,notification)
    log = YAML::load(File.read(template))
    uuid = notification['instance_uuid']
    activity = notification["activity"]
    parameters = notification['parameters']
    receiving = notification['received']

    Dir.mkdir(log_dir+'/'+uuid) unless Dir.exist?(log_dir+'/'+uuid)
    time_added=false
    log["log"]["trace"]["concept:name"] ||= "Instance #{instancenr}" unless log["log"]["trace"]["concept:name"]
    File.open(log_dir+'/'+uuid+'/log.xes','w'){|f| f.puts log.to_yaml} unless File.exists? log_dir+'/'+uuid+'/log.xes'
    event = {}
    event["trace:id"] = instancenr
    if parameters && parameters.has_key?('label')
      event["concept:name"] = parameters["label"]
    else
      event["concept:name"]= log["log"]["trace"]["concept:name"]
    end
    event["concept:endpoint"] = notification["endpoint"] if notification["endpoint"]
    event["id:id"] = activity
    unless event_name=='receiving'
      event["lifecycle:transition"]= event_name=='done'?"complete":"start"
    else
      event["lifecycle:transition"]="unknown"
    end
    data_send = ((parameters["arguments"].nil? ? [] : parameters["arguments"]) rescue [])
    event["list"] = {"data_send" => data_send} unless data_send.empty?
    if receiving && receiving.any?
      if event.has_key? "list"
        event["list"]["data_received"] ||= receiving
      else
        event["list"] = {"data_receiver" => receiving}
      end
    end
    event["time:timestamp"]= Time.now.iso8601 unless time_added
    File.open(log_dir+'/'+uuid+'/log.xes',"a") do |f|
      f << {'event' => event}.to_yaml
      pid, size = `ps ax -o pid,rss | grep -E "^[[:space:]]*#{$$}"`.strip.split.map(&:to_i)
      File.open(log_dir+'/'+uuid+'/memory.file',"a+"){ |fl| fl<< size << "\n" }
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
    topic        = @p[1].value
    event_name   = @p[2].value
    log_dir      = @a[0]
    template     = @a[1]
    instancenr   = @h['CPEE_INSTANCE'].split('/').last
    notification = JSON.parse(@p[3].value)
    doc event_name, log_dir, template, instancenr, notification
  end
end  #}}}

Riddl::Server.new(File.join(__dir__,'/log.xml'), :host => 'localhost', :port => 9299) do #{{{
  accessible_description true
  cross_site_xhr true
  @riddl_opts[:log_dir] ||= File.join(__dir__,'logs')
  @riddl_opts[:template] ||= File.join(__dir__,'template.xes_yaml')

  interface 'events' do
	  run Logging, @riddl_opts[:log_dir], @riddl_opts[:template] if post 'event'
  end
  interface 'logoverlay' do |r|
    run Riddl::Utils::FileServe, log_dir + r[:h]["RIDDL_DECLARATION_PATH"]+ ".xes","text/plain" if get
  end

end.loop! #}}}
