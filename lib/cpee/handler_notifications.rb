class NotificationsHandler < Riddl::Utils::Notifications::Producer::HandlerBase
  def ws_open(socket)
    @data.add_ws(@key,socket)
  end
  def ws_close
    @data.del_ws(@key)
  end
  def ws_message(socket,data)
    begin
      doc = XML::Smart::string(data)
      callback = doc.find("string(/vote/@id)")
      result = doc.find("string(/vote)")
      @data.callbacks[callback].callback(result == 'true' ? true : false)
      @data.callbacks.delete(callback)
    rescue
      puts "Invalid message over websocket"
    end
  end

  def create
    @data.unserialize_notifications!(:cre,@key)
    @data.notify('properties/handlers/change')
  end
  def delete
    @data.unserialize_notifications!(:del,@key)
    @data.notify('properties/handlers/change')
  end
  def update
    @data.unserialize_notifications!(:upd,@key)
    @data.notify('properties/handlers/change')
  end
end
