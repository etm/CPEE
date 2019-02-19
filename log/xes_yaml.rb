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

    activity = notification['activity']
    parameters = notification['parameters']
    receiving = notification['received']

    log = YAML::load(File.read(template))
    log["log"]["trace"]["concept:name"] ||= instancenr
    log["log"]["trace"]["cpee:name"] ||= notification['instance_name'] if notification["instance_name"]
    log["log"]["trace"]["cpee:uuid"] ||= notification['instance_uuid'] if notification["instance_uuid"]
    File.open(File.join(log_dir,uuid+'.xes.yaml'),'w'){|f| f.puts log.to_yaml} unless File.exists? File.join(log_dir,uuid+'.xes.yaml')
    event = {}
    event["concept:instance"] = instancenr
    event["concept:name"] = notification["label"] if notification["label"]
    if notification["endpoint"]
      event["concept:endpoint"] = notification["endpoint"]
    end
    event["id:id"] = (activity.nil? || activity == "") ? 'external' : activity
    event["cpee:uuid"] = notification['instance_uuid'] if notification["instance_uuid"]
    case event_name
      when 'receiving', 'change', 'instantiation'
        event["lifecycle:transition"] = "unknown"
      when 'done'
        event["lifecycle:transition"] = "complete"
      else
        event["lifecycle:transition"] = "start"
    end
    event["cpee:lifecycle:transition"] = "#{topic}/#{event_name}"
    data_send = ((parameters["arguments"].nil? ? [] : parameters["arguments"]) rescue [])
    event["data"] = {"data_send" => data_send} unless data_send.empty?
    if notification['changed']&.any?
      if event.has_key? "data"
        event["data"]["data_changed"] ||= notification['changed']
      else
        event["data"] = {"data_changer" => notification['changed']}
      end
    end
    if notification['values']&.any?
      if event.has_key? "data"
        event["data"]["data_values"] ||= notification['values']
      else
        event["data"] = {"data_values" => notification['values']}
      end
    end
    unless receiving&.empty?
      if event.has_key? "data"
        event["data"]["data_received"] ||= receiving
      else
        event["data"] = {"data_receiver" => receiving}
      end
    end
    event["time:timestamp"]= event['cpee:timestamp'] || Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z")
    File.open(File.join(log_dir,uuid+'.xes.yaml'),'a') do |f|
      f << {'event' => event}.to_yaml
    end
    nil
  end

  def response
    topic         = @p[1].value
    event_name    = @p[2].value
    log_dir       = @a[0]
    template      = @a[1]
    instancenr    = @h['CPEE_INSTANCE_URL'].split('/').last
    notification  = JSON.parse(@p[3].value)
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
