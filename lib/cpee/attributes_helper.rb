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

require 'weel'

class AttributesHelper
  def translate(__attributes__,__dataelements__,__endpoints__)
    @data       = WEEL::ReadHash.new(__dataelements__)
    @endpoints  = WEEL::ReadHash.new(__endpoints__)
    @attributes = WEEL::ReadHash.new(__attributes__)
    __attributes__.transform_values do |v|
      v.gsub(/(!(attributes|data|endpoints)\.[\w_]+)/) do |m|
        eval(m[1..-1])
      end
    end
  end

  def data
    @data
  end

  def endpoints
    @endpoints
  end

  def attributes
    @attributes
  end
end

