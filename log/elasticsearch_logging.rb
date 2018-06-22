require 'pp'
require 'time'
require 'digest'

require 'json'
require 'yaml'
require 'riddl/server'
require 'faraday'
require 'elasticsearch'

class Logging < Riddl::Implementation

  def traverse(node,paths=[[]],anal=[],depth=0) #{{{
    cpath = paths.last.dup
    case node
      when Hash
        node.each do |k,v|
          unless cpath.empty?
            paths.last << [] unless paths.last.last.class == Array
            paths << cpath.dup
          end
          paths.last << k
          traverse(v,paths,anal,depth+1)
        end
      when Array
        node.each_with_index do |e,i|
          posanal = [depth,paths.length,nil,[]]
          anal << posanal

          unless cpath.empty?
            paths.last << [] unless paths.last.last.class == Array
            paths << cpath.dup
          end
          paths.last << i
          traverse(e,paths,posanal.last,depth+1)
          dp = cpath.dup
          dp << [] unless dp.last.class == Array
          paths << dp unless paths.include?(dp)

          posanal[2] = paths.length - 1
        end
      else
        paths.last << [] unless paths.last.last.class == Array
    end
  end #}}}
  def duplicate(doc,paths,anal) #{{{
    res = []
    deep_cloned = Marshal::load(Marshal.dump(paths))
    anal.each_with_index do |e,ei|
      local_cloned = Marshal::load(Marshal.dump(deep_cloned))
      anal.select{ |a| a == e }.each do |a|
        (a[1]).upto(a[2]) do |i|
          local_cloned[i].last << a[0]
        end
      end
      anal.reject{ |a| a == e }.each do |a|
        (a[1]).upto(a[2]) do |i|
          local_cloned[i] = nil
        end
      end
      if !e[3]&.empty?
        e[3..-1].each_with_index do |ee,eei|
          ret = duplicate(doc,local_cloned,ee)
          res.concat ret
        end
      else
        res << extract_from_doc(doc,local_cloned.compact)
      end
    end
    res
  end #}}}
  def extract_from_doc(doc,paths) #{{{
    ret = {}
    paths.each do |p|
      next if p.nil?
      a = doc.dig(*p[0..-2])

      py = p.dup
      p[-1].each_with_index do |px,i|
        py.delete_at(px-i)
      end

      x1 = py[-2]
      x2 = py[0..-3]
      where = ret
      if x2.any?
        where = ret.dig(*x2)
      end
      where[x1] = {}

      unless a.class == Hash || a.class == Array
        where[x1] = a
      end
    end
    ret
  end #}}}

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
                "type" => "text"
              },
              "name" => {
                "type" => "text"
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
                "type" => "text"
              },
              "task" => {
                "type" => "text"
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
                "type" => "text"
              },
              "sensor" => {
                "type" => "text"
              },
              "task" => {
                "type" => "text"
              },
              "timestamp": {
                "type": "date",
                "format": "date_time"
              },
              "value" => {
                "type" => "text",
                "fields" => {
                  "value_f" => {
                    "type" => "float"
                  },
                  "value_l" => {
                    "type" => "long"
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
        sensors.each do |s|
          sid = Digest::MD5.hexdigest(uuid + '_' + s['name'])
          esc.index  index: 'sensors', type: 'entry', id: sid, body: {
            'uuid': uuid,
            'sensor': s['name'],
            'task': notification.dig('activity'),
            'visualizer_url': s['visualizer_url'],
            'visualizer_params': [s['visualizer_params']]
          }
        end

        tdoc = notification.dig('received',0,'data')
        paths = [[]]
        anal  = []
        traverse(tdoc,paths,anal)
        anal.uniq!
        p paths

        res = duplicate(tdoc,paths,anal)

        res.each do |r|
          pp r
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
