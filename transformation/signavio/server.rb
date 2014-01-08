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
require File.expand_path(File.dirname(__FILE__) + '/lib/translation')
require 'json'

class ExtractDescription < Riddl::Implementation
  def response
    graph = Graph.new
    start = nil
    tree = []

    doc = XML::Smart.string(@p[0].value.read)
    doc.register_namespace 'bm',  "http://www.omg.org/spec/BPMN/20100524/MODEL" 

    des = []
    doc.find("/bm:definitions/bm:process/bm:property[bm:dataState/@name='cpee:dataelement']").each do |ref|
      des << ref.attributes['name']
    end  

    # assign all important nodes to nodes
    doc.find("/bm:definitions/bm:process/bm:*[@id and @name]").each do |e|
      n = Node.new(e.attributes['id'],e.qname.name.to_sym,e.attributes['name'],e.find('count(bm:incoming)'),e.find('count(bm:outgoing)'))

      e.find("bm:property[@name='cpee:endpoint']/@itemSubjectRef").each do |ep|
        n.endpoints << ep
      end
      e.find("bm:script").each do |s|
        n.script << s.text
      end
      e.find("bm:ioSpecification/bm:dataInput").each do |a|
        name = a.attributes['name']
        value = a.attributes['itemSubjectRef']
        if des.include?(value)
          n.parameters[name] = 'data.' + value
        else  
          n.parameters[name] = value
        end
      end

      graph.add_node n
      start = n if n.type == :startEvent && start == nil
    end

    # extract all sequences to a links
    doc.find("/bm:definitions/bm:process/bm:sequenceFlow").each do |e|
      source = e.attributes['sourceRef']
      target = e.attributes['targetRef']
      graph.add_flow Link.new(source, target)
    end

    graph.build_tree tree, start
    xml = CPEEStructureMapping.new(tree).generate

    return Riddl::Parameter::Complex.new("description","text/xml",xml.to_s)
  end
end

class ExtractDataelements < Riddl::Implementation
  def response
    doc = XML::Smart.string(@p[0].value.read)
    doc.register_namespace 'bm',  "http://www.omg.org/spec/BPMN/20100524/MODEL" 

    ret = []
    doc.find("/bm:definitions/bm:process/bm:property[bm:dataState/@name='cpee:dataelement']").each do |ref|
      ret << Riddl::Parameter::Simple.new("name",ref.attributes['name'])
      if ref.attributes['itemSubjectRef']
        doc.find("/bm:definitions/bm:itemDefinition[@id=\"" + ref.attributes['itemSubjectRef'] + "\"]").each do |sref|
          ret << Riddl::Parameter::Simple.new("value",sref.attributes['structureRef'].to_s)
        end 
      else
        ret << Riddl::Parameter::Simple.new("value",'')
      end  
    end
    ret
  end
end

class ExtractEndpoints < Riddl::Implementation
  def response
    doc = XML::Smart.string(@p[0].value.read)
    doc.register_namespace 'bm',  "http://www.omg.org/spec/BPMN/20100524/MODEL" 

    ret = []
    doc.find("/bm:definitions/bm:process/bm:property[bm:dataState/@name='cpee:endpoint']/@itemSubjectRef").each do |ref|
      doc.find("/bm:definitions/bm:itemDefinition[@id=\"" + ref.value + "\"]/@structureRef").each do |sref|
        ret << Riddl::Parameter::Simple.new("name",ref.value)
        ret << Riddl::Parameter::Simple.new("value",sref.value)
      end  
    end
    ret
  end
end

Riddl::Server.new(File.dirname(__FILE__) + '/translation.xml', :port => 9295) do
  accessible_description true
  cross_site_xhr true

  on resource do
    run ExtractDescription if post 'dedesc'
    run ExtractDataelements if post 'dadesc'
    run ExtractEndpoints if post 'endesc'
  end
end.loop!
