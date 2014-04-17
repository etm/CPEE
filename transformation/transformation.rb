#!/usr/bin/ruby
# Apache License, Version 2.0
# 
# Copyright (c) 2013 Juergen Mangler
# 
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
#     http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

require 'rubygems'
require 'riddl/server'
require 'xml/smart'
require File.expand_path(File.dirname(__FILE__) + '/lib/bpmn2')
require 'json'

class ExtractDescription < Riddl::Implementation #{{{
  def response
    bpmn2 = ProcessTransformation::Source::BPMN2.new(@p[0].value.read)
    xml = bpmn2.model(ProcessTransformation::Target::CPEE)

    return Riddl::Parameter::Complex.new("description","text/xml",xml.to_s)
  end
end #}}}

class ExtractDataelements < Riddl::Implementation #{{{
  def response
    ret = []

    bpmn2 = ProcessTransformation::Source::BPMN2.new(@p[0].value.read)
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

    bpmn2 = ProcessTransformation::Source::BPMN2.new(@p[0].value.read)
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
