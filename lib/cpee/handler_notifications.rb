# This file is part of CPEE.
#
# CPEE is free software: you can redistribute it and/or modify it under the terms
# of the GNU General Public License as published by the Free Software Foundation,
# either version 3 of the License, or (at your option) any later version.
#
# CPEE is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
# PARTICULAR PURPOSE.  See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along with
# CPEE (file COPYING in the main directory).  If not, see
# <http://www.gnu.org/licenses/>.

class NotificationsHandler < Riddl::Utils::Notifications::Producer::HandlerBase
  def ws_open(socket)
    @data.add_websocket(@key,socket)
  end
  def ws_close
    @data.unserialize_notifications!(:del,@key)
    @data.notify('handler/change', :instance => @data.instance)
  end
  def ws_message(data)
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
    @data.notify('handler/change', :instance => @data.instance)
  end
  def delete
    @data.unserialize_notifications!(:del,@key)
    @data.notify('handler/change', :instance => @data.instance)
  end
  def update
    @data.unserialize_notifications!(:upd,@key)
    @data.notify('handler/change', :instance => @data.instance)
  end
end
