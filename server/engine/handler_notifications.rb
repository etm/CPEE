class NotificationsHandler < Riddl::Utils::Notifications::Producer::HandlerBase
  def ws_open(socket)
    $controller[@backend.id].add_ws(@key,socket)
  end
  def ws_close
    $controller[@backend.id].del_ws(@key)
  end
  def ws_message(socket,data)
    begin
      doc = XML::Smart::string(data)
      callback = doc.find("string(/vote/@id)")
      result = doc.find("string(/vote)")
      $controller[@backend.id].callbacks[callback].callback(result == 'true' ? true : false)
      $controller[@backend.id].callbacks.delete(callback)
    rescue
      puts "Invalid message over websocket"
    end
  end

  def create
    $controller[@backend.id].unserialize_event!(:cre,@key)
    $controller[@backend.id].notify('properties/handlers/change')
  end
  def delete
    $controller[@backend.id].unserialize_event!(:del,@key)
    $controller[@backend.id].notify('properties/handlers/change')
  end
  def update
    $controller[@backend.id].unserialize_event!(:upd,@key)
    $controller[@backend.id].notify('properties/handlers/change')
  end
end
