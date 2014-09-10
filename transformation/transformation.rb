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
require 'xml/smart'
if File.exists?(File.dirname(__FILE__) + '/../lib/cpee/processtransformation/bpmn2')
  require File.expand_path(File.dirname(__FILE__) + '/../lib/cpee/processtransformation/bpmn2')
  require File.expand_path(File.dirname(__FILE__) + '/../lib/cpee/processtransformation/cpee')
else
  require 'cpee/processtransformation/bpmn2'
  require 'cpee/processtransformation/cpee'
end
require 'json'

class ExtractDescription < Riddl::Implementation #{{{
  def response
    bpmn2 = CPEE::ProcessTransformation::Source::BPMN2.new(@p[0].value.read)
    bpmn2.build_traces
    bpmn2.build_tree(false)
    xml = bpmn2.generate_model(CPEE::ProcessTransformation::Target::CPEE)

    return Riddl::Parameter::Complex.new("description","text/xml",xml.to_s)
  end
end #}}}

class ExtractDataelements < Riddl::Implementation #{{{
  def response
    ret = []

    bpmn2 = CPEE::ProcessTransformation::Source::BPMN2.new(@p[0].value.read)
    bpmn2.dataelements.each do |k,v|
      ret << Riddl::Parameter::Simple.new("name",k)
      ret << Riddl::Parameter::Simple.new("value",v)
    end  

    ret
  end  
end #}}}

class ExtractEndpoints < Riddl::Implementation #{{{
  def response
    ret = []

    bpmn2 = CPEE::ProcessTransformation::Source::BPMN2.new(@p[0].value.read)
    bpmn2.endpoints.each do |k,v|
      ret << Riddl::Parameter::Simple.new("name",k)
      ret << Riddl::Parameter::Simple.new("value",v)
    end  

    ret
  end  
end #}}}

Riddl::Server.new(File.dirname(__FILE__) + '/transformation_dec.xml', :port => 9295) do
  accessible_description true
  cross_site_xhr true

  interface 'main' do
    run ExtractDescription if post 'dedesc'
    run ExtractDataelements if post 'dadesc'
    run ExtractEndpoints if post 'endesc'
  end
end.loop!
