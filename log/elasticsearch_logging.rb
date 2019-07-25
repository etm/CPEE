require 'pp'
require 'time'
require 'digest'

require 'json'
require 'yaml'
require 'riddl/server'
require 'faraday'
require 'elasticsearch'

class Logging < Riddl::Implementation

  def doc(topic,event_name,esc,template,instancenr,notification)
    uuid = notification['instance_uuid']
    return unless uuid

    # activity   = notification['activity']
    # parameters = notification['parameters']
    # receiving  = notification['received']
    # attributes = notification['attributes']

    unless esc.indices.exists? index: 'artefacts' #{{{
      esc.indices.create index: 'artefacts', body: {
        "mappings" => {
          "entry" => {
            "properties" => {
              "group" => {
                "type" => "keyword"

              },
              "name" => {
                "type" => "keyword"
              }
            }
          }
        }
      }
    end #}}}
    unless esc.indices.exists? index: 'instances' #{{{
      esc.indices.create index: 'instances', body: {
        "mappings" => {
          "entry" => {
            "properties" => {
              "uuid" => {
                "type" => "text"
              },
              "group" => {
                "type" => "keyword"
              },
              "name" => {
                "type" => "keyword"
              },
              "date": {
                "type": "date",
                "format": "date_time_no_millis"
              },
              "info": {
                "type": "keyword"
              }
            }
          }
        }
      }
    end #}}}
    unless esc.indices.exists? index: 'spawned' #{{{
      esc.indices.create index: 'spawned', body: {
        "mappings" => {
          "entry" => {
            "properties" => {
              "uuid" => {
                "type" => "text"
              },
              "spawned_uuid" => {
                "type" => "text"
              },
              "date": {
                "type": "date",
                "format": "date_time_no_millis"
              },
            }
          }
        }
      }
    end #}}}
    unless esc.indices.exists? index: 'sensors' #{{{
      esc.indices.create index: 'sensors', body: {
        "mappings" => {
          "entry" => {
            "properties" => {
              "uuid" => {
                "type" => "text"
              },
              "sensor" => {
                "type" => "keyword"
              },
              "task" => {
                "type" => "keyword"
              },
              "visualizer_url" => {
                "type" => "text"
              },
              "visualizer_params" => {
                "type" => "nested"
              }
            }
          }
        }
      }
    end #}}}
    unless esc.indices.exists? index: 'values' #{{{
      esc.indices.create index: 'values', body: {
        "mappings" => {
          "entry" => {
            "properties" => {
              "uuid" => {
                "type" => "keyword"
              },
              "sensor" => {
                "type" => "keyword"
              },
              "task" => {
                "type" => "keyword"
              },
              "timestamp": {
                "type": "date",
                "format": "date_time"
              },
              "value" => {
                "type" => "text",
                "fields" => {
                  "value_f" => {
                    "type" => "float",
                    "store" => true
                  },
                  "value_l" => {
                    "type" => "long",
                    "store" => true
                  }
                }
              }
            }
          }
        }
      }
    end #}}}

    uuid = notification.dig('instance_uuid')

    if notification.dig('attributes','artefacts') #{{{
      artefacts = JSON.parse(notification.dig('attributes','artefacts'))

      artefacts.each do |a|
        aid = Digest::MD5.hexdigest(a['group'] + '_' + a['name'])
        iid = Digest::MD5.hexdigest(a['group'] + '_' + a['name'] + '_' + uuid)
        esc.index  index: 'artefacts', type: 'entry', id: aid, body: a
        esc.index  index: 'instances', type: 'entry', id: iid, body: {
          'uuid':  uuid,
          'group': a['group'],
          'name':  a['name'],
          'date':  Time.now.iso8601,
          'info':  notification.dig('attributes','info')
        }

      end
    end #}}}

    pp notification
    case "#{topic}/#{event_name}"
      when "dataelements/change", "endpoints/change"
        sensors = JSON.parse(notification.dig('attributes','sensors') || '[]')
        sensors.each do |s|
          sid = Digest::MD5.hexdigest(uuid + '_' + s['name'])
          esc.index  index: 'sensors', type: 'entry', id: sid, body: {
            'uuid': uuid,
            'sensor': s['name'],
            'visualizer_url': s['visualizer_url'],
            'visualizer_params': [s['visualizer_params']]
          }
          esc.index  index: 'values', type: 'entry', body: {
            'uuid': uuid,
            'sensor': s['name'],
            'timestamp': notification.dig('timestamp'),
            'value': s['value']
          }
        end
      when "activity/receiving"
        sensors = JSON.parse(notification.dig('sensors') || '[]')
        tdoc = notification.dig('received')
        sensors.each do |s|
          sid = Digest::MD5.hexdigest(uuid + '_' + s['name'])
          esc.index  index: 'sensors', type: 'entry', id: sid, body: {
            'uuid': uuid,
            'sensor': s['name'],
            'task': notification.dig('activity'),
            'visualizer_url': s['visualizer_url'],
            'visualizer_params': (s['visualizer_params'].nil? || s['visualizer_params'].empty? ? [] : [s['visualizer_params']])
          }
          status, result = Riddl::Client.new(s['extractor_url']).post [
            Riddl::Parameter::Simple.new('data',JSON.pretty_generate(tdoc)),
            Riddl::Parameter::Simple.new('what',s['extractor_arg'])
          ]
          if status >= 200 && status < 300
            ret = JSON::parse(result[0]&.value.read) rescue []
            ret.each do |v,t|
              esc.index  index: 'values', type: 'entry', body: {
                'uuid': uuid,
                'sensor': s['name'],
                'timestamp': t,
                'value': v
              }
            end
          end

        end
    end
    nil
  end

  def response #{{{
    ### save events for later replay
    # a = {
    #   :topic        => @p[1].value,
    #   :event_name   => @p[2].value,
    #   :instancenr   => @h['CPEE_INSTANCE'].split('/').last,
    #   :notification => JSON.parse(@p[3].value)
    # }.to_yaml
    # File.open('events.yaml','a') do |f|
    #   f << a
    # end
    topic        = @p[1].value
    event_name   = @p[2].value
    esc          = @a[0]
    template     = @a[1]
    instancenr   = @h['CPEE_INSTANCE'].split('/').last
    notification = JSON.parse(@p[3].value)
    doc topic, event_name, esc, template, instancenr, notification
  end #}}}
end
