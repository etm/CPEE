#!/usr/bin/ruby
require 'rubygems'
require 'riddl/client'
require 'xml/smart'
require 'pp'

numinstances = 4
cpee = "http://localhost:9298/"

def create_instance(srv,name)
  res = srv.resource("/")
  status, response = res.post [
    Riddl::Parameter::Simple.new("name","Performance #{name}")
  ]
  ins = -1
  if status == 200
    ins = response.first.value
    params = []

    XML::Smart.open("testset.xml") do |doc|
      doc.register_namespace 'desc', 'http://cpee.org/ns/description/1.0'
      res = srv.resource("/#{ins}/properties/values")
      #["transformation"].each do |item|
      #  status, response = res.post [ 
      #    Riddl::Parameter::Simple.new("property",item)
      #  ]
      #end
      ["handlerwrapper","positions","dataelements","endpoints","transformation"].each do |item|
        params << Riddl::Parameter::Simple.new("name",item)
        params << Riddl::Parameter::Simple.new("content",doc.find("/testset/#{item}").first.dump)
      end  
      ["description"].each do |item|
        params << Riddl::Parameter::Simple.new("name",item)
        params << Riddl::Parameter::Simple.new("content","<content>" + doc.find("/testset/desc:#{item}").first.dump + "</content>")
      end
        params << Riddl::Parameter::Simple.new("name",'state')
        params << Riddl::Parameter::Simple.new("value","running")

      status, response = res.put params
    end   
  end
  ins
end  

t = []
tim = Time.now.to_f
1.upto(numinstances) do |name|
#  t << Thread.new(name) { |name|
    srv  = Riddl::Client.new(cpee)
    puts create_instance(srv,name)
#  }
end

#t.each { |k| k.join }
puts Time.now.to_f - tim
