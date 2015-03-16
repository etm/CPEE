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
        @data.notify('handlerwrapper/change', :instance => @data.instance)
      when 'description'
        nots = @data.unserialize_description!
        nots.uniq.each do |noti|
          @data.notify(*noti)
        end
      when 'endpoints'
        @data.unserialize_endpoints!
        @data.notify('endpoints/change', :instance => @data.instance)
      when 'dataelements'
        @data.unserialize_dataelements!
        @data.notify('dataelements/change', :instance => @data.instance)
      when 'attributes'
        @data.unserialize_attributes!
        @data.notify('attributes/change', :instance => @data.instance)
      when 'positions'  
        @data.unserialize_positions!
        @data.notify('position/change', :instance => @data.instance)
      when 'transformation'  
        @data.notify('transformation/change', :instance => @data.instance)
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
