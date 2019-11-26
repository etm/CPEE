require 'pp'
require 'time'
require 'digest'

require 'json'
require 'riddl/server'
require 'typhoeus'

EP_ARTEFACTS = "https://api.powerbi.com/beta/7ba47c6d-039d-44e5-8834-ee103ea08c19/datasets/2fb85c30-2e66-42d3-ac16-18c1fe76f501/rows?key=qpnTPKsn4ekXasNFs9he4afwAb%2Bj8DndJ6mGAomCGkkAdKsIDifRDK9hsQd0mk3X94KCzqGrNCYN%2Fs7T7STQjg%3D%3D"
EP_INSTANCES = "https://api.powerbi.com/beta/7ba47c6d-039d-44e5-8834-ee103ea08c19/datasets/25c94fa0-f6f3-4547-9815-f772e1abc92f/rows?key=vWSGqHeQp6BQ8IPt4RBMLAbDPhVsyTW2NVcXfqQBCMx17cAZXfVejyAW72MeMGSbEk3fguhhqLoR3nYmopLIow%3D%3D"
EP_SPAWNED   = "https://api.powerbi.com/beta/7ba47c6d-039d-44e5-8834-ee103ea08c19/datasets/79620e3f-a65c-4e34-b859-5aa43074f086/rows?key=dFS4XmqxI8iauMKucZenHQOi6mNcPhBslYo%2B8NwlzMYgiDYN%2FGDv6hX%2BwHMRIJwvQDyCxgd614KDihPw1Q%2BGSA%3D%3D"
EP_SENSORS   = "https://api.powerbi.com/beta/7ba47c6d-039d-44e5-8834-ee103ea08c19/datasets/b62aada9-fe26-43e6-9e18-4bd3978e651d/rows?key=QWKNhGe3glUuWMOkCmJPytVQjaCn1Wyf8NboH3RXJTdA2ryiY%2Fk5%2Fz2lXDpgfguAa1xq%2BO%2Fw3lDhuXLYx4CyFA%3D%3D"
EP_VALUES    = "https://api.powerbi.com/beta/7ba47c6d-039d-44e5-8834-ee103ea08c19/datasets/fc53f106-0299-458d-aa33-a04a00d68571/rows?key=mp9Om5wrPLG5hDA4efGzpfEGG5uHRUTtnUGlzNrfHJ5qaub2fG2FpwS5gq3g4IYRKMWG7mlCK5pgwm48XxtItw%3D%3D"

class Logging < Riddl::Implementation

  def doc(topic,event_name,instancenr,notification)
    uuid = notification['instance_uuid']
    return unless uuid

    uuid = notification.dig('instance_uuid')

    if notification.dig('attributes','artefacts') #{{{
      artefacts = JSON.parse(notification.dig('attributes','artefacts'))

      artefacts.each do |a|
        aid = Digest::MD5.hexdigest(a['group'] + '_' + a['name'])
        iid = Digest::MD5.hexdigest(a['group'] + '_' + a['name'] + '_' + uuid)
        Typhoeus.post(EP_ARTEFACTS,
          headers: {'Content-Type'=> "application/json"},
          body: JSON.generate([a])
        )
        Typhoeus.post(EP_INSTANCES,
          headers: {'Content-Type'=> "application/json"},
          body: [
            {
              'uuid':  uuid,
              'group': a['group'],
              'name':  a['name'],
              'date':  Time.now.iso8601,
              'info':  notification.dig('attributes','info')
            }
          ]
        )
      end
    end #}}}

    case "#{topic}/#{event_name}"
      when "dataelements/change", "endpoints/change"
        sensors = JSON.parse(notification.dig('attributes','sensors') || '[]')
        sensors.each do |s|
          sid = Digest::MD5.hexdigest(uuid + '_' + s['name'])
          Typhoeus.post(EP_SENSORS,
            headers: {'Content-Type'=> "application/json"},
            body: [
              {
                'uuid': uuid,
                'sensor': s['name'],
                'visualizer_url': s['visualizer_url'],
                'visualizer_params': [s['visualizer_params']]
              }
            ]
          )
          Typhoeus.post(EP_VALUES,
            headers: {'Content-Type'=> "application/json"},
            body: [
              {
                'uuid': uuid,
                'sensor': s['name'],
                'timestamp': notification.dig('timestamp'),
                'value': s['value']
              }
            ]
          )
        end
      when "activity/receiving"
        sensors = JSON.parse(notification.dig('sensors') || '[]')
        tdoc = notification.dig('received')
        sensors.each do |s|
          sid = Digest::MD5.hexdigest(uuid + '_' + s['name'])
          Typhoeus.post(EP_SENSORS,
            headers: {'Content-Type'=> "application/json"},
            body: [
              {
                'uuid': uuid,
                'sensor': s['name'],
                'task': notification.dig('activity'),
                'visualizer_url': s['visualizer_url'],
                'visualizer_params': (s['visualizer_params'].nil? || s['visualizer_params'].empty? ? [] : [s['visualizer_params']])
              }
            ]
          )
          status, result = Riddl::Client.new(s['extractor_url']).post [
            Riddl::Parameter::Simple.new('data',JSON.pretty_generate(tdoc)),
            Riddl::Parameter::Simple.new('what',s['extractor_arg'])
          ]
          if status >= 200 && status < 300
            ret = JSON::parse(result[0]&.value.read) rescue []
            ret.each do |v,t|
              Typhoeus.post(EP_VALUES,
                headers: {'Content-Type'=> "application/json"},
                body: [
                  {
                    'uuid': uuid,
                    'sensor': s['name'],
                    'timestamp': t,
                    'value': v
                  }
                ]
              )
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
    instancenr   = @h['CPEE_INSTANCE'].split('/').last
    notification = JSON.parse(@p[3].value)
    doc topic, event_name, instancenr, notification
  end #}}}
end
