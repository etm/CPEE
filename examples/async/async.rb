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
require 'riddl/server'
require 'pp'

$cb = nil

class Async < Riddl::Implementation
  def response
    $cb = @h['CPEE_CALLBACK']
    @headers << Riddl::Header.new('CPEE-CALLBACK','true')
  end
end
class Ret < Riddl::Implementation
  def response
    Riddl::Parameter::Complex.new('text','text/plain',$cb.to_s)
  end
end
class Send < Riddl::Implementation
  def response
    status, res = Riddl::Client.new($cb).put [
      Riddl::Parameter::Complex.new('text','text/plain','hello world')
    ]
    p status
    nil
  end
end

options = {
  :host => 'localhost',
  :port => 9301,
  :secure => false
}

server = Riddl::Server.new(File.join(__dir__,'/async.xml'), options) do |opts|
  accessible_description true
  cross_site_xhr true

  on resource do
    run Async if post
    run Ret if get
    run Send if get 'send'
  end
end.loop!
