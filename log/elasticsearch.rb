#!/usr/bin/ruby
require 'pp'
require 'json'
require 'yaml'
require 'rubygems'
require 'riddl/server'
require 'riddl/utils/fileserve'
require 'json'
require 'time'

require 'faraday'
require 'elasticsearch'
require 'logger'

class Logging < Riddl::Implementation #{{{
  def doc(topic,event_name,esc,template,instancenr,notification)
    uuid = notification['instance_uuid']
    return unless uuid

    activity = notification['activity']
    parameters = notification['parameters']
    receiving = notification['received']

    log = YAML::load(File.read(template))
    log["log"]["trace"]["concept:name"] ||= instancenr.to_i
    log["log"]["trace"]["cpee:name"] ||= notification['instance_name'] if notification["instance_name"]
    log["log"]["trace"]["cpee:uuid"] ||= notification['instance_uuid'] if notification["instance_uuid"]
    unless esc.indices.exists? index: 'trace'
      esc.indices.create index: 'trace', body: {
        "mappings" => {
          "entry" => {
            "properties" => {
              "concept:name" => {
                "type" => "integer"
              },
              "cpee:name" => {
                "type" => "text"
              },
              "cpee:uuid": {
                "type" => "text"
              }
            }
          }
        }
      }
    end

    esc.index  index: 'trace', type: 'entry', id: log["log"]["trace"]["cpee:uuid"], body: log["log"]["trace"]
    p notification['attributes']

    event = {}
    event["trace:id"] = instancenr
    event["concept:name"] = notification["label"] if notification["label"]
    if notification["endpoint"]
      event["concept:endpoint"] = notification["endpoint"]
    end
    event["id:id"] = (activity.nil? || activity == "") ? 'external' : activity
    event["cpee:uuid"] = notification['instance_uuid'] if notification["instance_uuid"]
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

    iname = "instance_" + notification['instance_name'].downcase.gsub(/[^a-z]/,'_')
    esc.indices.create index: iname rescue nil
    esc.index  index: iname, type: 'entry', body: event
    nil
  end

  def response
    topic        = @p[1].value
    event_name   = @p[2].value
    esc          = @a[0]
    template     = @a[1]
    instancenr   = @h['CPEE_INSTANCE'].split('/').last
    notification = JSON.parse(@p[3].value)
    doc topic, event_name, esc, template, instancenr, notification
  end
end #}}}

Riddl::Server.new(File.join(__dir__,'/log.xml'), :host => 'localhost', :port => 9307) do
  accessible_description true
  cross_site_xhr true
  @riddl_opts[:template] ||= File.join(__dir__,'template.xes_yaml')
	@riddl_opts[:esc] = Elasticsearch::Client.new hosts: ['localhost:8400']


  interface 'events' do
	  run Logging, @riddl_opts[:esc], @riddl_opts[:template] if post 'event'
  end
end.loop!
