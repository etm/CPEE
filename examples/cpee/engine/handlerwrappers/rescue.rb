class RescueHash < Hash
  def self::new_from_obj(obj)
    RescueHash.new.merge(obj)
  end

  def value(key)
    results = []
    self.each do |k,v|
      results << v.value(key) if v.class == RescueHash
      results << v if k == key
    end
    results.length != 1 ? results.flatten : results[0]
  end

  def to_json(options = nil) #:nodoc:
    hash = as_json(options)

    result = '{ "!map:RescueHash": {'
    result << hash.map do |key, value|
      "#{ActiveSupport::JSON.encode(key.to_s)}:#{ActiveSupport::JSON.encode(value, options)}"
    end * ','
    result << '}}'
  end

  def as_json(options = nil) #:nodoc:
    if options
      if attrs = options[:except]
        except(*Array.wrap(attrs))
      elsif attrs = options[:only]
        slice(*Array.wrap(attrs))
      else
        self
      end
    else
      self
    end
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
    $controller[@instance].notify("running/activity_calling", :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay, :passthrough => passthrough, :endpoint => @handler_endpoint, :parameters => parameters)
    cpee_instance = "#{@url}/#{@instance}"

    params = []
    if parameters.key?(:info) && parameters[:info] == 'true' # {{{
      parameters[:parameters] = Array.new if (parameters.include?(:parameters) == false) || parameters[:parameters].nil?
      parameters[:parameters] << {'call-instance-uri' => cpee_instance}
      parameters[:parameters] << {'call-activity' => @handler_position}
      parameters[:parameters] << {'call-endpoint' => @handler_endpoint}
      parameters[:parameters] << {'call-lay' => @handler_lay}
      parameters[:parameters] << {'call-oid' => parameters[:'call-oid']} if parameters.include?(:'call-oid')
    end # }}}
     if parameters.include?(:templates) # {{{
      parameters[:parameters] << {'templates-uri' => parameters[:templates][0][:uri]}
      parameters[:parameters] << {'template-name' => parameters[:templates][1][:name]}
      parameters[:parameters] << {'template-lang' => parameters[:templates][2][:lang]}
    end # }}}
    if parameters.key?(:service) # {{{
      injection_handler_uri = parameters[:service][1][:injection_handler]
      # Give postion to injection-handler
      @handler_returnValue = nil 
      injection_handler = Riddl::Client.new(injection_handler_uri)
      status, resp = injection_handler.post [
        Riddl::Parameter::Simple.new('activity', @handler_position), 
        Riddl::Parameter::Simple.new('instance', cpee_instance)] # here could be consumer, producer secrets
      raise "Subscription to injection-handler at #{injection_handler_uri} failed with status #{status}" unless status == 200
      raise Wee::Signal::SkipManipulate # }}}
    elsif parameters.key?(:method) #{{{
      client = Riddl::Client.new(@handler_endpoint)
      type = parameters[:method]
      (parameters[:parameters] || {}).each do |h|
        if h.class == Hash
          h.each do |k,v|
            params <<  (parameters[:method].downcase == 'get' ? Riddl::Parameter::Simple.new("#{k}","#{v}", :query) : Riddl::Parameter::Simple.new("#{k}","#{v}"))
          end
        end
      end 
      callback = Digest::MD5.hexdigest(Kernel::rand().to_s)
      params << Riddl::Header.new("CPEE-Instance","#{$url}/#{@instance}")
      params << Riddl::Header.new("CPEE-Callback",callback)
      status, result, headers = client.request type => params
      raise "Could not perform http-#{type} on URI: #{@handler_endpoint} - Status: #{status}" unless status == 200
      if headers["CPEE_CALLBACK"] && headers["CPEE_CALLBACK"] == 'true'
        $controller[@instance].callbacks[callback] = Callback.new("callback activity: #{@handler_position}#{@handler_lay.nil? ? '': ", #{@handler_lay}"}",self,:callback,nil,nil,:http)
        return
      end
      @handler_returnValue = [result, status]# }}}
    elsif parameters.key?(:soap_operation)# {{{
      # Bulding SAOP-Envelope {{{
      wsdl_client = Riddl::Client.new(parameters[:wsdl].split('?')[0])
      params = []
      parameters[:wsdl].split('?')[1].split('&').each do |p|
        params << Riddl::Parameter::Simple.new(p.split('=')[0], p.split('=')[1], :query)
      end
      status, resp = wsdl_client.get params
      unless status == 200
        @handler_returnValue = [resp, status]
        @handler_continue.continue
        return
      end
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
      if out.find("//soap:Fault", {"soap"=>"http://schemas.xmlsoap.org/soap/envelope/"}).first
        @handler_returnValue = [out.find("//soap:Fault", {"soap"=>"http://schemas.xmlsoap.org/soap/envelope/"}).first, nil]
        @handler_continue.continue
        return
      end
      if out.namespaces.find("http://schemas.xmlsoap.org/soap/envelope/")
        result = out.find("//soap:Body", {"soap"=>"http://schemas.xmlsoap.org/soap/envelope/"}).first
        result.namespaces['soap'] = "http://schemas.xmlsoap.org/soap/envelope/"
      else
        result = out.find("//Body").first
      end
      @handler_returnValue = [result, nil]
    end# }}}  
    @handler_continue.continue
  end

  def activity_result_status
    Wee::Status.new(1, "everything okay")
  end

  def callback(result)
    @handler_returnValue = [result,nil]
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
    puts err.message
    puts err.backtrace
    $controller[@instance].notify("running/activity_failed", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay, :message => err.message, :line => err.backtrace[0].match(/(.*?):(\d+):/)[2], :where => err.backtrace[0].match(/(.*?):(\d+):/)[1])
  end
  def inform_syntax_error(err)
    puts err.message
    puts err.backtrace
    $controller[@instance].notify("properties/description/error", :instance => "#{$url}/#{@instance}", :message => err.message, :line => err.backtrace[0].match(/(.*?):(\d+):/)[2], :where => err.backtrace[0].match(/(.*?):(\d+):/)[1])
  end
  def inform_manipulate_change(status,context,endpoints)
    $controller[@instance].serialize!
    $controller[@instance].notify("properties/status/change", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay, :id => status.id, :message => status.message) unless status.nil?
    $controller[@instance].notify("properties/data-elements/change", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay, :changed => context) unless context.nil?
    $controller[@instance].notify("properties/endpoints/change", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay, :changed => endpoints) unless endpoints.nil?
  end
  def inform_position_change(ipc={})
    $controller[@instance].serialize_position!
    ipc[:instance] = "#{$url}/#{@instance}"
    $controller[@instance].notify("properties/position/change", ipc)
  end
  def inform_state_change(newstate)
    if $controller[@instance]
      $controller[@instance].serialize!
      $controller[@instance].notify("properties/state/change", :instance => "#{$url}/#{@instance}", :state => newstate)
    end
  end

  def vote_sync_after
    $controller[@instance].call_vote("running/syncing_after", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay)
  end
  def vote_sync_before
    $controller[@instance].call_vote("running/syncing_before", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay)
  end
end
