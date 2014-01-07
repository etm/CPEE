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
    doc.register_namespace 'dr',  "http://www.jboss.org/drools" 

    prop = []
    doc.find("/bm:definitions/bm:process/bm:property").each do |e|
      prop << e.attributes['id']
    end

    # assign all important nodes to nodes
    doc.find("/bm:definitions/bm:process/bm:*[@id and @name]").each do |e|
      n = Node.new(e.attributes['id'],e.qname.name.to_sym,e.attributes['name'],e.find('count(bm:incoming)'),e.find('count(bm:outgoing)'))

      e.find("bm:extensionElements/dr:metadata/dr:metaentry[dr:name='company']/dr:value").each do |comps|
        comps = JSON::parse(comps.text)
        comps.each do |comp|
          n.endpoints << comp['orgName'].gsub(/[^a-zA-Z]/,'') + "_" + comp['serviceOperationLabel']
        end 
      end
      e.find("bm:extensionElements/dr:metadata/dr:metaentry[dr:name='script']/dr:value").each do |s|
        n.script << s.text
      end
      e.find("bm:extensionElements/dr:metadata/dr:metaentry[dr:name='assignments']/dr:value").each do |a|
        a.text.split(',').each do |kv|
          kv = kv.split('=')
          if prop.include?(kv[1])
            n.parameters[kv[0]] = 'data.' + kv[1]
          else  
            n.parameters[kv[0]] = '"' + kv[1] + '"'
          end
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
    doc.register_namespace 'dr',  "http://www.jboss.org/drools" 

    ret = []
    doc.find("/bm:definitions/bm:process/bm:property").each do |e|
      ret << Riddl::Parameter::Simple.new("name",e.attributes['id'])
      ret << Riddl::Parameter::Simple.new("value","")
    end
    coll = {}
    doc.find("/bm:definitions/bm:process/bm:extensionElements/dr:metadata/dr:metaentry[dr:name='vardefs']/dr:value").each do |anns|
      anns.text.split(',').each do |ann|
        a = ann.split(':')
        coll[a[0]] = a[2]
      end
    end
    ret << Riddl::Parameter::Simple.new("name",'ANNOTATIONS')
    ret << Riddl::Parameter::Simple.new("value",JSON::generate(coll))
    ret
  end
end

class ExtractEndpoints < Riddl::Implementation
  def response
    doc = XML::Smart.string(@p[0].value.read)
    doc.register_namespace 'bm',  "http://www.omg.org/spec/BPMN/20100524/MODEL" 
    doc.register_namespace 'dr',  "http://www.jboss.org/drools" 

    ret = []
    coll = {}
    doc.find("/bm:definitions/bm:process/bm:task/bm:extensionElements/dr:metadata/dr:metaentry[dr:name='company']/dr:value").each do |comps|
      comps = JSON::parse(comps.text)
      comps.each do |comp|
        coll[comp['orgName'].gsub(/[^a-zA-Z]/,'') + "_" + comp['serviceOperationLabel']] = comp['serviceEndpoint'] + "#" + comp['serviceOperationLabel']
      end 
    end
    coll.each do |k,v|
      ret << Riddl::Parameter::Simple.new("name",k)
      ret << Riddl::Parameter::Simple.new("value",v)
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
