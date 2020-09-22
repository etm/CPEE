#!/usr/bin/ruby
require 'xml/smart'

Dir['*.rng'].each do |f|
  XML::Smart.modify(f) do |doc|
    doc.root.attributes['ns'] = 'http://cpee.org/ns/description/1.0'
  end
end
