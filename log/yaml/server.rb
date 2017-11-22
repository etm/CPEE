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
  LOGTEMPLATE = {"log" =>  
    {"extension" =>
      { "time" =>"http://www.xes-standard.org/time.xesext", 
        "concept" => "http://www.xes-standard.org/concept.xesext", 
        "organisational" => "http://www.xes-standard.org/org.xesext", 
        "lifecylce" => "http://www.xes-standard.org/lifecycle.xesext"
      },
      "global" => 
        {
          "trace" =>{"concept:name" => "__INVALID__"},
          "event"=> {
            "concept:name"=>"__INVALID__",
            "concept:endpoint" => "", 
            "id:id" => "", 
            "lifecycle:transition" => "complete",
            "time:timestamp" => ""
          }
        },
      "classifier" =>{
        "Data" => "data_send data_received",
        "Data_Received"=>"data_receiver",
        "Data_Send" => "data_send"
      },
      "trace" => {}
    }
  }
  def doc(event_name,log_dir,instancenr,notification)
    x = Time.now
    log = LOGTEMPLATE
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
    y = Time.now
    z = y-x
    File.open(log_dir+'/'+uuid+'/time.file',"a+"){ |f| f<< z << "\n" }
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
    topic = @p[1].value
    event_name = @p[2].value
    log_dir = ::File.dirname(__FILE__) + "/../logs_yaml"
    instancenr = @h['CPEE_INSTANCE'].split('/').last
    notification = JSON.parse(@p[3].value)
    doc(event_name,log_dir,instancenr,notification)
  end
end  #}}}


Riddl::Server.new(::File.dirname(__FILE__) + '/log.xml', :host => "coruscant.wst.univie.ac.at", :port => 9300) do #{{{
  accessible_description true
  cross_site_xhr true
  log_path = "/home/demo/Projects/cpee-helpers/log/logs_yaml"

  interface 'events' do
	    run Logging if post 'event'
  end
  interface 'logoverlay' do |r|
    run Riddl::Utils::FileServe, log_path + r[:h]["RIDDL_DECLARATION_PATH"]+ ".xes","text/xml" if get
  end


end.loop! #}}}
