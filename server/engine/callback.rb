module CPEE

  class Callback
    def initialize(info,handler,method,event,key,protocol,*data)
      @info = info
      @event = event
      @key = key
      @data = data
      @handler = handler
      @protocol = protocol
      @method = method.class == Symbol ? method : :callback
    end

    attr_reader :info, :protocol, :method

    def delete_if!(event,key)
      @handler.send @method, :DELETE, *@data if @key == key && @event == event
      nil
    end

    def callback(result)
      @handler.send @method, result, *@data
    end
  end

end
