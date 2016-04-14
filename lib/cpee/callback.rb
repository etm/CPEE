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

    def callback(result=nil,options=nil)
      @handler.send @method, result, options, *@data
    end
  end

end
