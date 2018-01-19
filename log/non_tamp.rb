#!/usr/bin/ruby
require 'pp'
require 'json'
require 'rubygems'
require 'fileutils'
require 'riddl/server'
require 'riddl/client'
require 'riddl/utils/notifications_producer'
require 'riddl/utils/properties'
require 'riddl/utils/downloadify'
require 'riddl/utils/turtle'
require 'time'

class FileServe < Riddl::Implementation
  def response
    path = File.file?(@a[0]) ? @a[0] : "#{@a[0]}/#{@r[@match.length-1..-1].join('/')}".gsub(/\/+/,'/')

    if File.directory?(path)
      @status = 404
      return []
    end
    if File.exists?(path)
			fmt = @a[1] || begin
				mt = MIME::Types.type_for(path).first
				if mt.nil?
					'text/plain;charset=utf-8'
				else
					apx = ''
					if mt.ascii?
						tstr = File.read(path,CharlockHolmes::EncodingDetector::DEFAULT_BINARY_SCAN_LEN)
						apx = ';charset=' + CharlockHolmes::EncodingDetector.detect(tstr)[:encoding]
					end
					mt.to_s + apx
				end
			end
			return Riddl::Parameter::Complex.new('file',fmt,File.open(path,'r'))
    end
    @status = 404
  end
end

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
    time_added=false
    log["log"]["trace"]["concept:name"] ||= "Instance #{instancenr}" unless log["log"]["trace"]["concept:name"]
    if File.exists? log_dir+'/log.xes'
      previous_hash = File.read(log_dir+'/last.event').strip
    else
      File.open(log_dir+'/log.xes','w'){|f| f.puts log.to_yaml}
      previous_hash = "0"
    end
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
    event["bc:hash"]= calc_hash(event.to_yaml,previous_hash)
    event["bc:previous_hash"]= previous_hash
    File.open(log_dir+'/log.xes',"a") do |f|
      f << {'event' => event}.to_yaml
    end
    File.open(log_dir+'/last.event',"w"){ |fl| fl << event["bc:hash"] }
  end

  def calc_hash(data, previous_hash) # data includes timestamp, index and payload
    sha = Digest::SHA256.new
    sha.update(data.to_s + previous_hash)
    sha.hexdigest
  end

  def response
    log_dir = @a[0]
    library = Riddl::Client.new(@h['CPEE_INSTANCE'] + "/properties/values/attributes/bc")
    status, res = library.get
    if status == 200
      topic = @p[1].value
      event_name = @p[2].value
      notification = JSON.parse(@p[3].value)
      if topic == 'state' && notification['state'] == 'ready' && XML::Smart.string(res[0].value.read).find('string(/*)') == "start"
        FileUtils.rm_f Dir.glob(log_dir+'/*')
      end
      if topic == 'activity'
        instancenr = @h['CPEE_INSTANCE'].split('/').last
        doc(event_name,log_dir,instancenr,notification)
      end
    end
  end
end  #}}}

Riddl::Server.new(::File.dirname(__FILE__) + '/chain.xml', :host => "coruscant.wst.univie.ac.at", :port => 9399) do #{{{
  accessible_description true
  cross_site_xhr true

  @riddl_opts[:log_dir] = ::File.dirname(__FILE__) + "/non_tamp"

  interface 'events' do
    run Logging, @riddl_opts[:log_dir] if post 'event'
  end
  interface 'logoverlay' do |r|
    run FileServe, "#{@riddl_opts[:log_dir]}/log.xes","application/x-yaml" if get '*'
  end
end.loop! #}}}
