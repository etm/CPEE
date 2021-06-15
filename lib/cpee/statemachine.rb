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

  class StateMachine
    def initialize(file,readonly,&state)
      @states = XML::Smart.open_unprotected(file)
      @state = state
      @readonly = readonly
    end

    def setable?(id,nval)
      cval = @state.call(id)
      @states.find("/states/setable/#{cval}[#{nval}]").length > 0
    end

    def readonly?(id)
      @readonly.include? @state.call(id)
    end
  end

end
