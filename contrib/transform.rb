#!/usr/bin/ruby
require 'xml/smart'

Dir.glob('**/*.xml').each do |f|
  if File.file? f
    XML::Smart.modify(f) do |d|
      if d.register_namespace 'd', 'http://cpee.org/ns/description/1.0'
        d.find('//d:manipulate').each do |e|
          if e.find('d:code').length == 0
            t = e.text
            e.text = ''
            e.add('d:code',t)
          end
        end
      end
    end
  end
end
