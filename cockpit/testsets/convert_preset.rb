#!/usr/bin/ruby
require 'xml/smart'

Dir['*.xml'].each do |f|
  XML::Smart.modify(f) do |doc|
    p f
    doc.register_namespace 'd', 'http://cpee.org/ns/description/1.0'
    doc.register_namespace 'p', 'http://riddl.org/ns/common-patterns/properties/1.0'
    if doc.root.qname.name == 'testset'
      doc.find('//d:call').each do |e|
        x = e.find('d:finalize')
        if x.length > 0
          code = x.first.add_before 'code'
          code.add x
          code.add e.find('d:update')
        end
        x = e.find('d:_timing')
        if x.length > 0
          code = x.first.add_before 'annotations'
          code.add x
          code.add e.find('d:_notes')
        end
      end
      begin
        if doc.find('//attributes/p:theme').any?
          doc.find('//attributes/p:theme').first.text = 'preset'
        end
      rescue
      end
    end
  end
end
