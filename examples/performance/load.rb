#!/usr/bin/ruby
require 'rubygems'
require 'riddl/client'
require 'xml/smart'
require 'pp'

numinstances = 100
cpees = [ "http://localhost:9298/" ]
instances = []

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
      res = srv.resource("/#{ins}/properties/values")
      ["transformation"].each do |item|
        status, response = res.post [
          Riddl::Parameter::Simple.new("property",item)
        ]
      end
      ["executionwrapper","positions","dataelements","endpoints","transformation","description"].each do |item|
        params << Riddl::Parameter::Simple.new("name",item)
        params << Riddl::Parameter::Simple.new("content",doc.find("/testset/#{item}").first.dump)
      end
      status, response = res.put params
    end
  end
  ins
end

t = []
1.upto(numinstances) do |i|
  t << Thread.new(i) { |name|
    cpee = rand(cpees.length)
    srv  = Riddl::Client.new(cpees[cpee])
    p create_instance(srv,name)
  }
end

t.each { |k| k.join }
