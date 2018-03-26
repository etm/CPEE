#!/usr/bin/ruby
require 'pp'
require 'json'
require 'yaml'
require 'rubygems'
require 'riddl/server'
require 'riddl/utils/fileserve'
require 'time'

class Logging < Riddl::Implementation #{{{
  def doc(topic,event_name,log_dir,template,instancenr,notification)
    uuid = notification['instance_uuid']
    return unless uuid

    activity = notification["activity"]
    parameters = notification['parameters']
    receiving = notification['received']

    log = YAML::load(File.read(template))
    log["log"]["trace"]["concept:name"] ||= instancenr
    log["log"]["trace"]["cpee:name"] ||= notification['instance_name'] if notification["instance_name"]
    log["log"]["trace"]["cpee:uuid"] ||= notification['instance_uuid'] if notification["instance_uuid"]
    File.open(File.join(log_dir,uuid+'.xes.yaml'),'w'){|f| f.puts log.to_yaml} unless File.exists? File.join(log_dir,uuid+'.xes.yaml')
    event = {}
    event["trace:id"] = instancenr
    event["concept:name"] = notification["label"] if notification["label"]
    if notification["endpoint"]
      event["concept:endpoint"] = notification["endpoint"]
    else
      event["concept:name"] = 'Script Task'
    end
    event["id:id"] = activity
    case event_name
      when 'receiving', 'change'
        event["lifecycle:transition"] = "unknown"
      when 'done'
        event["lifecycle:transition"] = "complete"
      else
        event["lifecycle:transition"] = "start"
    end
    event["cpee:lifecycle:transition"] = "#{topic}/#{event_name}"
    data_send = ((parameters["arguments"].nil? ? [] : parameters["arguments"]) rescue [])
    event["list"] = {"data_send" => data_send} unless data_send.empty?
    if notification['changed']&.any?
      if event.has_key? "list"
        event["list"]["data_changed"] ||= notification['changed']
      else
        event["list"] = {"data_changer" => notification['changed']}
      end
    end
    if notification['values']&.any?
      if event.has_key? "list"
        event["list"]["data_values"] ||= notification['values']
      else
        event["list"] = {"data_values" => notification['values']}
      end
    end
    if receiving&.any?
      if event.has_key? "list"
        event["list"]["data_received"] ||= receiving
      else
        event["list"] = {"data_receiver" => receiving}
      end
    end
    event["time:timestamp"]= Time.now.iso8601
    File.open(File.join(log_dir,uuid+'.xes.yaml'),'a') do |f|
      f << {'event' => event}.to_yaml
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
    doc topic, event_name, log_dir, template, instancenr, notification
  end
end #}}}

Riddl::Server.new(File.join(__dir__,'/log.xml'), :host => 'localhost', :port => 9299) do
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
end.loop!
