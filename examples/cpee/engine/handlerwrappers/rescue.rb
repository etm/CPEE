require 'cgi'

class RescueHash < Hash
  def value(key)
    results = []
    self.each do |k,v|
      results << v.value(key) if v.class == RescueHash
      results << v if k == key.to_sym
    end
    results.length != 1 ? results.flatten : results[0]
  end
end

module Kernel
  def neq(value)
    self != value
  end
end

class RescueHandlerWrapper < Wee::HandlerWrapperBase
  def initialize(arguments,endpoint=nil,position=nil,lay=nil,continue=nil)
    @instance = arguments[0].to_i
    @url = arguments[1]
    @handler_stopped = false
    @handler_continue = continue
    @handler_endpoint = endpoint
    @handler_position = position
    @handler_lay = lay
    @handler_returnValue = nil
  end

  # executes a ws-call to the given endpoint with the given parameters. the call
  def activity_handle(passthrough, parameters)
    puts '==Handler-started=='*5
    $controller[@instance].position
    $controller[@instance].notify("running/activity_calling", :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay, :passthrough => passthrough, :endpoint => @handler_endpoint, :parameters => parameters) 
    cpee_instance = "#{@url}/#{@instance}/"

    pp "Endpoint: #{@handler_endpoint}"
    pp "Position: #{@handler_position}"
    pp 'Parameters:'
    pp parameters.to_yaml

    params = []
    if parameters.key?(:service) # {{{
# Just fir testing
raise Wee::Signal::SkipManipulate unless parameters[:service].length != 0
# Just fir testing

      injection_handler_uri = parameters[:service][1][:injection_handler]
      puts "Subscribe #{injection_handler_uri} at URL #{cpee_instance}notifications/subscriptions for position #{@handler_position}"
      # Giv postion to injection-handler
      injection_handler = Riddl::Client.new(injection_handler_uri)
      status, resp = injection_handler.post [Riddl::Parameter::Simple.new("position", @handler_position)] # here could be consumer, producer secrets
      puts resp.inspect
      res_id = resp.value('id')
      raise "Subscription to injection-handler at #{injection_handler_uri}/#{res_id} failed with status #{status}" until status == 200
      @handler_returnValue = resp.value('id')
      # Subscribe Injection-Handler/{id} to syncing_after
      cpee = Riddl::Client.new(cpee_instance)
      status, resp = cpee.resource("notifications/subscriptions").post [
        Riddl::Parameter::Simple.new("url", "#{injection_handler_uri}/#{res_id}"),
        Riddl::Parameter::Simple.new("topic", "running"),
        Riddl::Parameter::Simple.new("votes", "syncing_after")
      ]
      raise "'Subscribtion of #{injection_handler_uri} at #{cpee_instance} failed with status: #{status}'" if status != 200
      puts "== Finished: subscription at #{injection_handler_uri}/#{res_id} done"
      raise Wee::Signal::SkipManipulate
    end # }}}
    if parameters.key?(:group)# {{{
      (parameters[:group] || {}).each do |h|
        if h.class == Hash
          h.each do |k,v|
            params <<  Riddl::Parameter::Simple.new("#{k}","#{v}")
            puts "=== adding parameter for grouping: #{k} => #{v}"
          end
        end
      end
    end# }}}
    if parameters.key?(:method) #{{{
      puts "== performing a call to service"
      client = Riddl::Client.new(@handler_endpoint)

      (parameters[:parameters] || {}).each do |h|
        if h.class == Hash
          h.each do |k,v|
            params <<  Riddl::Parameter::Simple.new("#{k}","#{v}", :query) if parameters[:method].downcase == "get"
            params <<  Riddl::Parameter::Simple.new("#{k}","#{v}") if parameters[:method].downcase != "get"
            puts "=== adding parameter: #{k}"
          end
        end
      end 
      callback = Digest::MD5.hexdigest(rand(Time.now).to_s)
      params << Riddl::Header.new("CPEE-Callback",callback)
      type = parameters[:method]
      puts "=== Type: #{type}"
      puts "== Performing call"
      status, result, headers = client.request type => params
      puts "== Call finished with status: #{status}"
      raise "Could not #{parameters[:method] || 'post'} #{@handler_endpoint}" if status != 200
      if headers["CPEE-Callback"] && headers["CPEE-Callback"] == true
        $controller[@instance].callbacks[callback] = Callback.new("callback activity: #{@handler_position}#{@handler_lay.nil? ? '': ", #{@handler_lay}"}",self,:callback,:http)
        return
      end
      @handler_returnValue = result
    end# }}}
    if  parameters.key?(:soap_operation)# {{{
      # Bulding SAOP-Envelope {{{
      wsdl_client = Riddl::Client.new(parameters[:wsdl].split('?')[0])
      params = []
      parameters[:wsdl].split('?')[1].split('&').each do |p|
        params << Riddl::Parameter::Simple.new(p.split('=')[0], p.split('=')[1], :query)
      end
      status, resp = wsdl_client.get params
      raise "Endpoint #{parameters[:wsdl]} doesn't provide a WSDL" if status != 200
      wsdl = XML::Smart.string(resp[0].value.read)
      msg = wsdl.find("//wsdl:portType/wsdl:operation[@name = '#{parameters[:soap_operation]}']/wsdl:input/@message", {"wsdl"=>"http://schemas.xmlsoap.org/wsdl/"}).first
      envelope = XML::Smart.string("<Envelope/>")
      ns1 = envelope.root.namespaces.add("ns1", wsdl.root.attributes['targetNamespace']) 
      ns_soap = envelope.root.namespaces.add("soap", "http://schemas.xmlsoap.org/soap/envelope/")
      body = envelope.root.add("Body")
      soap_params = body.add("#{parameters[:soap_operation]}")
      soap_params.namespace = ns1
      parameters[:parameters].each do |hash|
        hash.each do |k,v|
          soap_params.add("#{k}","#{v}") # used #{} to get implicit escaping of XML
        end
      end #}}}
      service = Riddl::Client.new(@handler_endpoint)
      status, result = service.post [Riddl::Parameter::Complex.new("", "text/xml", envelope.to_s)]
      out = XML::Smart.string(result[0].value.read)
      raise "Error in SOAP-Request: \"#{out.find("//soap:Fault", {"soap"=>"http://schemas.xmlsoap.org/soap/envelope/"}).first.dump}\"" if out.find("//soap:Fault", {"soap"=>"http://schemas.xmlsoap.org/soap/envelope/"}).first
      if out.namespaces.find("http://schemas.xmlsoap.org/soap/envelope/")
        result = out.find("//soap:Body", {"soap"=>"http://schemas.xmlsoap.org/soap/envelope/"}).first
        result.namespaces['soap'] = "http://schemas.xmlsoap.org/soap/envelope/"
      else
        result = out.find("//Body").first
      end
      @handler_returnValue = result
    end# }}} 
    @handler_continue.continue
    puts "ReturnValue: #{@handler_returnValue.inspect}"
    puts '==Handler finished=='*5
  end

  def callback(result)
    @handler_returnValue = result
    @handler_continue.continue
  end
 
  # returns the result of the last handled call
  def activity_result_value
    @handler_returnValue
  end

  # Called if the WS-Call should be interrupted. The decision how to deal
  # with this situation is given to the handler. To provide the possibility
  # of a continue the Handler will be asked for a passthrough
  def activity_stop
    @handler_stopped = true
  end
  # is called from Wee after stop_call to ask for a passthrough-value that may give
  # information about how to continue the call. This passthrough-value is given
  # to activity_handle if the workflow is configured to do so.
  def activity_passthrough_value
    nil
  end
  
  # Called if the execution of the actual activity_handle is not necessary anymore
  # It is definit that the call will not be continued.
  # At this stage, this is only the case if parallel branches are not needed
  # anymore to continue the workflow
  def activity_no_longer_necessary
    @handler_stopped = true
  end

  def inform_activity_done
    $controller[@instance].notify("running/activity_done", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay)
  end
  def inform_activity_manipulate
    $controller[@instance].notify("running/activity_manipulating", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay)
  end
  def inform_activity_failed(err)
    $controller[@instance].notify("running/activity_failed", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay, :message => err.message)
  end
  def inform_syntax_error(err)
    puts err.message
    puts err.backtrace
    $controller[@instance].notify("properties/description/error", :instance => "#{$url}/#{@instance}", :message => err.message)
  end
  def inform_context_change(changed)
    $controller[@instance].serialize!
    $controller[@instance].notify("properties/context-variables/change", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay, :changed => changed)
  end
  def inform_endpoints_change(changed)
    $controller[@instance].serialize!
    $controller[@instance].notify("properties/endpoints/change", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay, :changed => changed)
  end
  def inform_position_change
    $controller[@instance].position
  end
  def inform_state_change(newstate)
    if $controller[@instance]
      $controller[@instance].serialize!
      $controller[@instance].notify("properties/state/change", :instance => "#{$url}/#{@instance}", :state => newstate, :activity => @handler_position, :lay => @handler_lay, :endpoint => @handler_endpoint)
    end
  end

  def vote_sync_after
    $controller[@instance].call_vote("running/syncing_after", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay)
  end
  def vote_sync_before
    $controller[@instance].call_vote("running/syncing_before", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay)
  end
end
