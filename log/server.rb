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


class Logging < Riddl::Implementation #{{{
  LOGTEMPLATE = <<-END
    <log xmlns="http://www.xes-standard.org/" xes.version="2.0" xes.features="nested-attributes">
      <extension name="Time" prefix="time" uri="http://www.xes-standard.org/time.xesext"/>
      <extension name="Concept" prefix="concept" uri="http://www.xes-standard.org/concept.xesext"/>
      <extension name="Organizational" prefix="org" uri="http://www.xes-standard.org/org.xesext"/>
      <trace/>
    </log>
  END
  def response
    topic = @p[1].value
    event_name = @p[2].value
    if(topic == 'activity' && (event_name=='done' || event_name == 'calling'))
      log_dir = ::File.dirname(__FILE__) + "/logs"
      instancenr = @h['CPEE_INSTANCE'].split('/').last
      notification = JSON.parse(@p[3].value)
      parameters = notification['parameters']
      Dir.mkdir(log_dir+'/'+instancenr) unless Dir.exist?(log_dir+'/'+instancenr)
      time_added=false
      XML::Smart.modify(log_dir+'/'+instancenr+'/log.xes',LOGTEMPLATE) do |xml|
        begin
          trace = xml.find("/xmlns:log/xmlns:trace").first
          trace.add 'string', :key => "concept:name", :value => "Instance #{instancenr}" if trace.find('xmlns:string').empty?
          event = trace.add "event"
          event.add 'string', :key => "concept:name", :value => parameters["label"] if parameters && parameters.has_key?('label')
          event.add 'string', :key => "concept:instance", :value => notification["endpoint"] if notification["endpoint"]
          event.add 'string', :key => "id:id", :value => notification["activity"]
          event.add 'string', :key => "lifecycle:transition", :value => event_name=='done'?"complete":"start"
          data_send = ((parameters[:arguments].nil? ? [] : parameters[:arguments]) rescue [])
          if data_send.any?
            list = event.add 'list', :key => "data_send"
            data_send.each do |k,v|
              list.add 'string', :key => k , :value => v
            end
          end
          event.add 'date', :key => "time:timestamp", :value => Time.now unless time_added
        rescue => e
          puts e.message
          puts e.backtrace
        end
      end
    elsif(event_name=='receiving')
      log_dir = ::File.dirname(__FILE__) + "/logs"
      instancenr = @h['CPEE_INSTANCE'].split('/').last
      notification = JSON.parse(@p[3].value)
      receiving = notification['received']
      pp receiving
      Dir.mkdir(log_dir+'/'+instancenr) unless Dir.exist?(log_dir+'/'+instancenr)
      time_added=false
      XML::Smart.modify(log_dir+'/'+instancenr+'/log.xes',LOGTEMPLATE) do |xml|
        begin
          trace = xml.find("/xmlns:log/xmlns:trace").first
          trace.add 'string', :key => "concept:name", :value => "Instance #{instancenr}" if trace.find('xmlns:string').empty?
          event = trace.add "event"
          event.add 'string', :key => "concept:instance", :value => notification["endpoint"] if notification["endpoint"]
          event.add 'string', :key => "id:id", :value => notification["activity"]
          event.add 'string', :key => "lifecycle:transition", :value => "unknown"
          if receiving.any?
            list = event.add 'list', :key => "data_received"
            receiving.each do |k,v|
              list.add 'string', :key => k, :value => v
            end
          end
          event.add 'date', :key => "time:timestamp", :value => Time.now unless time_added
        rescue => e
          puts e.message
          puts e.backtrace
        end
      end  
    else
      pp "Something wrong"
    end
  end
end  #}}}


Riddl::Server.new(::File.dirname(__FILE__) + '/log.xml', :host => "cpee.org", :port => 9299) do #{{{
  accessible_description true
  cross_site_xhr true
  log_path = "/home/demo/Projects/cpee-helpers/log/logs"

  interface 'events' do
	    run Logging if post 'event'
	    #run CB if post 'vote'
  end
  interface 'logoverlay' do |r|
    run Riddl::Utils::FileServe, log_path + r[:h]["RIDDL_DECLARATION_PATH"]+ ".xes","text/xml" if get
  end


end.loop! #}}}
