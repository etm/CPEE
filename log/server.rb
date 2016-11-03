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
  def response
    topic = @p[1].value
    event = @p[2].value
    if(topic == 'activity' && (event=='done' || event == 'calling'))
      log_dir = ::File.dirname(__FILE__) + "/logs"
      instancenr = @h['CPEE_INSTANCE'].split('/').last
      notification = JSON.parse(@p[3].value)
      log_hash = notification['log_hash']
      Dir.mkdir(log_dir+'/'+instancenr) unless Dir.exist?(log_dir+'/'+instancenr)
      unless File.exist?(log_dir+'/'+instancenr+'/log.xes')
        FileUtils.cp(::File.dirname(__FILE__)+'/template.xes', log_dir+'/'+instancenr+'/log.xes')
        XML::Smart.modify(log_dir+'/'+instancenr+'/log.xes') do |xml|
          trace = xml.find("/xmlns:log/xmlns:trace").first
          trace.add 'string', :key => "concept:name", :value => "Instance #{instancenr}"
        end
      end

      time_added=false
      XML::Smart.modify(log_dir+'/'+instancenr+'/log.xes') do |xml|
        trace = xml.find("/xmlns:log/xmlns:trace").first
        event = trace.add "event"
        event.add 'string', :key => "concept:name", :value => log_hash["label"]
        event.add 'string', :key => "lifecycle:transition", :value => event=='done'?"complete":"start"
        if log_hash.has_key?("data_send")
          list = event.add 'list', :key => "data_send"
          log_hash["data_send"].each do |k,v|
            list.add 'string', :key => k , :value => v
          end
        end
        if log_hash.has_key?("data_received")
          log_hash["data_received"].delete_if do |e|
            if e.keys[0]=="timestamp"
              event.add 'date', :key => "time:timestamp", :value => e.values[0]
             time_added=true
              true
            else
              false
            end
          end
          if log_hash["data_received"].length > 0
            list = event.add 'list', :key => "data_received"
            log_hash["data_received"].each{|e| list.add 'string', :key => e.keys[0] , :value => e.values[0]}
          end
        end
        event.add 'date', :key => "time:timestamp", :value => Time.now unless time_added
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
