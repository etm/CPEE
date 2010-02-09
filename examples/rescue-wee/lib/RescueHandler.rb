# require 'Thread'
require 'pp'
require ::File.dirname(__FILE__) + '/../../../lib/Wee'
require ::File.dirname(__FILE__) + '/../includes/client'

class RescueHandler < Wee::HandlerWrapperBase

  def initialize(url)
    @urls = url[0].split(',')
    @expand_params = true

    @__myhandler_stopped = false
    @__myhandler_finished = false
    @__myhandler_returnValue = nil
  end

  def log(type, details)
  end

  def getServices( link, resource, services )
    client = Riddl::Client.new(link).resource('/'+resource)

    begin
      status, res = client.request :get => []
    rescue
      message = "Server (#{link}) refused connection on resource: " + resource
      p message
      return Show.new().showPage("Error: Connection refused", message, status, true)
    end

    xml = XML::Smart::string(res[0].value.read)
    if res[0].name == "list-of-subgroups" || res[0].name == "list-of-services"
      xml.namespaces = {"atom" => "http://www.w3.org/2005/atom"}
      xml.find("//atom:entry/atom:id").each do |id|
        getServices(link, resource+"/"+id.text, services)
      end
    elsif res[0].name == "details-of-service"
      link = xml.find("string(//service/URI)")
      name = xml.find("string(//vendor/name)")
      services <<  {'name'=>name, 'link'=>link, 'repoURI'=> resource}
    end
  end


  # executes a Riddle-call to the given endpoint with the given parameters.
  def handle_call(position, passthrough, endpoint, parameters)
    @__myhandler_finished = false

puts '-'*50
pp parameters.inspect
puts endpoint
puts"="
puts :endpoint
puts '-'*50


    interactionURI = @urls[0].split("/")[0..2].join("/")
    interactionResource = @urls[0].split("/")[3..-1].join("/")
    interactionWEE = Riddl::Client.new(interactionURI).resource(interactionResource+"/wee")
    interactionRESCUE = Riddl::Client.new(interactionURI).resource(interactionResource+"/rescue")
    @__myhandler_returnValue = Array.new

    # Preparing parameters for query-requests
    riddlParams = Array.new()
    begin
      status, res = Riddl::Client.new(@urls[1]).resource(endpoint.split("/")[0]).get [Riddl::Parameter::Simple.new("queryInput", "")]
    rescue
      puts "Error receiving queryInput-Properties for #{endpoint}"
    end

    rng = XML::Smart::string(res[0].value.read)
    rng.namespaces = {"rng" => "http://relaxng.org/ns/structure/1.0"}
    elements = rng.find("//rng:define/rng:element/@name")
    elements.each do |e|
      riddlParams.push Riddl::Parameter::Simple.new e.value, parameters[e.value.to_sym]
    end


puts '-'*50
puts "QueryInput-Parameters:"
pp riddlParams.inspect
puts '-'*50

    # Find services within the given endpoint
    services = Array.new()
    getServices(@urls[1], endpoint, services)


puts '-'*50
puts "Found services:"
puts services.inspect
puts '-'*50
    

    id = 0
    xml = XML::Smart.string("<?xml version='1.0'?><queryResultsList/>")
    xml.root.attributes.add("uri", endpoint)
    xml.root.attributes.add("position", position)
    xml.root.add("interactionURI", @urls[0])

    services.each do |s|
      client = Riddl::Client.new(s['link'])
      begin
        status, resp = client.get riddlParams
      rescue
        puts "Error while executing query at #{s['link']}"
      end
      if status == 200
        respXML = XML::Smart.string(resp[0].value.read)
        entries = respXML.find("//entry")
        entries.each do |entry|
          entry.attributes.add("id", id)
          entry.attributes.add("name", s['name'])
          entry.attributes.add("serviceURI", s['link'])
          entry.attributes.add("repiURI", s['repoURI'])
          xml.root.add(entry)
          id = id + 1
        end
      end
    end

    # Posting alternatives
puts '-'*50
puts xml
puts '-'*50

    begin
      status, qi = interactionWEE.request :post => [Riddl::Parameter::Simple.new("xml", xml)]
    rescue
      puts "Server (#{interactionURI}) refused connection on resource: #{interactionWEE}"
    end

    # Reading user selection
    begin
      status, userSelection = interactionRESCUE.request :get => [Riddl::Parameter::Simple.new("xml", xml)]
    rescue
      puts "Server (#{interactionURI}) refused connection on resource: #{interactionResource}/rescue"
    end

    # Select entry to user-selection
    selected = xml.find("//entry[@id=#{userSelection[0].value}]").first

    # Prepare invokeOutput to be stored in the context
    begin
      status, res = Riddl::Client.new(@urls[1]).resource(endpoint.split("/")[0]).get [Riddl::Parameter::Simple.new("queryOutput", "")]
    rescue
      puts "Error receiving queryInput-Properties for #{endpoint}"
    end    
    rng = XML::Smart::string(res[0].value.read)
    rng.namespaces = {"rng" => "http://relaxng.org/ns/structure/1.0"}
    rng.find("//rng:define/rng:element/@name").each do |e|
      @__myhandler_returnValue.push selected.find("string(//#{e.value})").first
    end

    # Preparing invoke-Parameter

    riddlParams = Array.new()
    begin
      status, res = Riddl::Client.new(@urls[1]).resource(endpoint.split("/")[0]).get [Riddl::Parameter::Simple.new("invokeInput", "")]
    rescue
      puts "Error receiving queryInput-Properties for #{endpoint}"
    end    
    rng = XML::Smart::string(res[0].value.read)
    rng.namespaces = {"rng" => "http://relaxng.org/ns/structure/1.0"}
    rng.find("//rng:define/rng:element/@name").each do |e|
      if parameters.include?(e.value.to_sym)
        riddlParams.push Riddl::Parameter::Simple.new e.value, parameters[e.value.to_sym] 
      else
        riddlParams.push Riddl::Parameter::Simple.new e.value, selected.find("string(//entry/#{e.value})").first
      end
    end


puts '-'*50
puts "invokeInput-Parameters:"
puts riddlParams.inspect
puts '-'*50

    # invoke service
    serviceURI = selected.attributes.get_attr('serviceURI').value
    begin
      status, res = Riddl::Client.new(serviceURI).resource("").post riddlParams
    rescue
      puts "Error invoking service #{serviceURI}"
      puts $!
    end

    xml = XML::Smart::string(res[0].value.read)

puts "invoke-Output"
puts xml

    # save invoke-output to context
    begin
      status, res = Riddl::Client.new(@urls[1]).resource(endpoint.split("/")[0]).get [Riddl::Parameter::Simple.new("invokeOutput", "")]
    rescue
      puts "Error receiving invokeOutput-Properties for #{endpoint}"
    end

    rng = XML::Smart::string(res[0].value.read)
    rng.namespaces = {"rng" => "http://relaxng.org/ns/structure/1.0"}
    elements = rng.find("//rng:define/rng:element/@name")
    elements.each do |e|
puts "\t\tInvokeOUT: #{e.value} => #{xml.find("string(//#{e.value})").first} "
      @__myhandler_returnValue.push xml.find("string(//#{e.value})").first
    end

    @__myhandler_finished = true
  end

  def inform_activity_next(position, context)
  end

  def inform_activity_manipulate(position, context)
  end

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
