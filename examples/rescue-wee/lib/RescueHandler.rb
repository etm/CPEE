# require 'Thread'
require 'pp'
require ::File.dirname(__FILE__) + '/../../../lib/Wee'
require ::File.dirname(__FILE__) + '/../includes/client'

class RescueHandler < Wee::HandlerWrapperBase
  include MarkUSModule

  def initialize(url)
    puts '-'*50
    puts "\t\tExeuting workflow for device: #{url.inspect}"
    puts '-'*50
    @urls = url.is_a?(String) ? url.split(',') : url[0].split(',')
    @expand_params = true

    @__myhandler_stopped = false
    @__myhandler_finished = false
    @__myhandler_returnValue = nil
  end

  def log(type, details)
=begin
    p "[#{Time.now.to_s}] #{type}: #{details}"
    @urls.each do |url|
      Riddl::Client.new(url).post [
        Riddl::Parameter::Simple.new("stamp", Time.now.to_s),
        Riddl::Parameter::Simple.new("type", type),
        Riddl::Parameter::Simple.new("details", details)
      ]
    end
=end
  end

  # executes a Riddle-call to the given endpoint with the given parameters.
  def handle_call(position, passthrough, endpoint, parameters)
    @__myhandler_finished = false
    $xml = "<queryResultsList uri=\"Cinemas/Arthouse/\" position=\"#{position}\">
<interactionURI>#{@urls[0]}</interactionURI>
<entry id=\"1\" serviceURI=\"Cinemas/Arthouse/BlacksProduction/\">
<movieID>DYSK--21</movieID>
<date>31.01.2010</date>
<startingTime>16:42:00</startingTime>
<price>12.58</price>
</entry>
<entry id=\"2\" serviceURI=\"Cinemas/Arthouse/BlacksProduction/\">
<movieID>DYSK--12</movieID>
<date>31.01.2010</date>
<startingTime>10:47:00</startingTime>
<price>16.69</price>
</entry>
<entry id=\"3\" serviceURI=\"Cinemas/Arthouse/BlacksProduction/\">
<movieID>DYSK--42</movieID>
<date>31.01.2010</date>
<startingTime>15:55:00</startingTime>
<price>19.33</price>
</entry>
</queryResultsList>"
    $u = @urls[0].split("/")[0..2].join("/")
    $r = @urls[0].split("/")[3..-1].join("/")
    $wee = Riddl::Client.new($u).resource($r+"/wee")
    $rescue = Riddl::Client.new($u).resource($r+"/rescue")
    begin
      $status, $qi = $wee.request :post => [Riddl::Parameter::Simple.new("xml", $xml)]
    rescue
      puts "Server (#{$u}) refused connection on resource: #{$r}"
    end
    puts '-'*50
    puts "\t\tPosted results at #{$u}/#{$r}"
    puts '-'*50
    begin
      $status, $userSelection = $rescue.request :get => [Riddl::Parameter::Simple.new("xml", $xml)]
    rescue
      puts "Server (#{$u}) refused connection on resource: #{$r}"
    end
    puts '-'*50
    puts "================= User selected service with ID #{$userSelection[0].value} to use for #{endpoint} at #{position}"
    puts '-'*50
    @__myhandler_finished = true
  end

=begin
  def do_the_riddle(position, passthrough, endpoint, parameters)
    rdl_params = []
    parameters.each do |param|
      if param.is_a?Hash
        param.each do |key, value|
          rdl_params.push Riddl::Parameter::Simple.new key, value
        end
      end
    end
    p "Calling Riddl Service: #{endpoint} ... params = #{rdl_params.inspect}"
    status, res = Riddl::Client.new(endpoint).post rdl_params
    raise RuntimeError, "Invalid riddle request, return status = #{status.inspect}" if status != "200"
    id = res[0].value
    p "Service ID = #{id}"
    p "--------------------"

    while(true)
      status, res = Riddl::Client.new("#{endpoint}/#{id}").request :get => []
      raise RuntimeError, "Invalid riddle request, return status = #{status.inspect}" if status != "200"
      p "Checking Riddl Request: url = #{endpoint}/#{id}, Status = #{status.inspect}, res = #{res.inspect}"
      break if res[0].value == "stopped" || res[0].value == "finished"
      if @__myhandler_stopped
        break
      else
        sleep 1
      end
    end
    @__myhandler_finished = true
    @__myhandler_returnValue = "dummy_value"
  end
=end

  # returns true if the last handled call has finished processing, or the
  # call runs independent (asynchronous call)
  def finished_call
    return @__myhandler_finished
  end

  # returns the result of the last handled call
  def return_value
    @__myhandler_finished ? @__myhandler_returnValue : nil
  end
  # Called if the WS-Call should be interrupted. The decision how to deal
  # with this situation is given to the handler. To provide the possibility
  # of a continue the Handler will be asked for a passthrough
  def stop_call
    log "stop_call", "Recieved stop signal, aborting on next possibility"
    @__myhandler_stopped = true
  end
  # is called from Wee after stop_call to ask for a passthrough-value that may give
  # information about how to continue the call. This passthrough-value is given
  # to handle_call if the workflow is configured to do so.
  def passthrough
    nil
  end

  # Called if the execution of the actual handle_call is not necessary anymore
  # It is definit that the call will not be continued.
  # At this stage, this is only the case if parallel branches are not needed
  # anymore to continue the workflow
  def no_longer_necessary
    log "stop_call", "Recieved no_longer_necessary signal, aborting on next possibility"
    @__myhandler_stopped = true
  end
  # Is called if a Activity is executed correctly
  def inform_activity_done(activity, context)
    log "inform_activity_done", "Activity #{activity} done"
  end
  # Is called if a Activity is executed with an error
  def inform_activity_failed(activity, context, err)
    log "inform_activity_failed", "Activity #{activity} failed with error #{err}"
    raise(err)
  end
  def inform_workflow_state(newstate)
    log "inform_workflow_state", "State changed to #{newstate}"
  end
end
