#!/usr/bin/ruby
#
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

require 'rubygems'
gem 'nokogiri'
require File.expand_path(File.dirname(__FILE__) + '/../lib/cpee/implementation')

Riddl::Server.new(CPEE::SERVER, :port => 8298) do |opts|
  accessible_description true
  cross_site_xhr true
  process_out false

  use CPEE::implementation(opts)
end.loop!
