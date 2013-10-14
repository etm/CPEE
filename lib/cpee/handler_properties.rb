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

class PropertiesHandler < Riddl::Utils::Properties::HandlerBase
  def sync
    case @property
      when 'handlerwrapper'
        @data.unserialize_handlerwrapper!
        @data.notify('properties/handlerwrapper/change', :instance => @data.instance_url)
      when 'description'
        nots = @data.unserialize_description!
        @data.notify('properties/description/change', :instance => @data.instance_url)
        nots.uniq.each do |noti|
          @data.notify(*noti)
        end
      when 'endpoints'
        @data.unserialize_endpoints!
        @data.notify('properties/endpoints/change', :instance => @data.instance_url)
      when 'dataelements'
        @data.unserialize_dataelements!
        @data.notify('properties/dataelements/change', :instance => @data.instance_url)
      when 'positions'  
        @data.unserialize_positions!
        @data.notify('properties/position/change', :instance => @data.instance_url)
      when 'state'  
        @data.unserialize_state!
      else
        nil
    end
  end

  def create; sync; end
  def update; sync; end
  def delete; sync; end
end
