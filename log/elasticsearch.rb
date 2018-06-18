#!/usr/bin/ruby
require 'pp'
require 'rubygems'
require 'riddl/server'
require 'riddl/utils/fileserve'
require 'json'
require 'time'
require 'digest'
require 'time'

require 'faraday'
require 'elasticsearch'
require 'logger'

class Logging < Riddl::Implementation #{{{
  def doc(topic,event_name,esc,template,instancenr,notification)
    uuid = notification['instance_uuid']
    return unless uuid

    # activity   = notification['activity']
    # parameters = notification['parameters']
    # receiving  = notification['received']
    # attributes = notification['attributes']

    unless esc.indices.exists? index: 'artefacts'
      esc.indices.create index: 'artefacts', body: {
        "mappings" => {
          "entry" => {
            "properties" => {
              "group" => {
                "type" => "text"
              },
              "name" => {
                "type" => "text"
              }
            }
          }
        }
      }
    end
    unless esc.indices.exists? index: 'instances'
      esc.indices.create index: 'instances', body: {
        "mappings" => {
          "entry" => {
            "properties" => {
              "uuid" => {
                "type" => "text"
              },
              "group" => {
                "type" => "text"
              },
              "name" => {
                "type" => "text"
              },
              "date": {
                "type": "date",
                "format": "date_time_no_millis"
              },
              "info": {
                "type": "text"
              }
            }
          }
        }
      }
    end

    if notification.dig('attributes','artefact')
      artefact = JSON.parse(notification.dig('attributes','artefact'))

      artefact.each do |a|
        aid = Digest::MD5.hexdigest(a['group'] + '_' + a['name'])
        iid = Digest::MD5.hexdigest(a['group'] + '_' + a['name'] + '_' + notification.dig('attributes','uuid'))
        esc.index  index: 'artefacts', type: 'entry', id: aid, body: a
        esc.index  index: 'instances', type: 'entry', id: iid, body: {
          'uuid':  notification.dig('attributes','uuid'),
          'group': a['group'],
          'name':  a['name'],
          'date':  Time.now.iso8601,
          'info':  notification.dig('attributes','info')
        }

      end
    end

    case "#{topic}/#{event_name}"
      when "dataelements/change", "endpoints/change"
        if notification.dig('attributes','sensor')
          sensor = JSON.parse(notification.dig('attributes','sensor'))
          p sensor
        end
      when "activity/receiving"
        # sensors
    end



    # event = {}
    # event["trace:id"] = instancenr
    # event["concept:name"] = notification["label"] if notification["label"]
    # if notification["endpoint"]
    #   event["concept:endpoint"] = notification["endpoint"]
    # end
    # event["id:id"] = (activity.nil? || activity == "") ? 'external' : activity
    # event["cpee:uuid"] = notification['instance_uuid'] if notification["instance_uuid"]
    # case event_name
    #   when 'receiving', 'change'
    #     event["lifecycle:transition"] = "unknown"
    #   when 'done'
    #     event["lifecycle:transition"] = "complete"
    #   else
    #     event["lifecycle:transition"] = "start"
    # end
    # event["cpee:lifecycle:transition"] = "#{topic}/#{event_name}"
    # data_send = ((parameters["arguments"].nil? ? [] : parameters["arguments"]) rescue [])
    # event["list"] = {"data_send" => data_send} unless data_send.empty?
    # if notification['changed']&.any?
    #   if event.has_key? "list"
    #     event["list"]["data_changed"] ||= notification['changed']
    #   else
    #     event["list"] = {"data_changer" => notification['changed']}
    #   end
    # end
    # if notification['values']&.any?
    #   if event.has_key? "list"
    #     event["list"]["data_values"] ||= notification['values']
    #   else
    #     event["list"] = {"data_values" => notification['values']}
    #   end
    # end
    # if receiving&.any?
    #   if event.has_key? "list"
    #     event["list"]["data_received"] ||= receiving
    #   else
    #     event["list"] = {"data_receiver" => receiving}
    #   end
    # end
    # event["time:timestamp"]= Time.now.iso8601

    # iname = "instance_" + notification['instance_name'].downcase.gsub(/[^a-z]/,'_')
    # esc.indices.create index: iname rescue nil
    # esc.index  index: iname, type: 'entry', body: event
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
