#!/usr/bin/ruby
require 'xml/smart'

Dir['*.xml'].each do |f|
  XML::Smart.modify(f) do |doc|
    doc.register_namespace 'd', 'http://cpee.org/ns/description/1.0'
    doc.register_namespace 'p', 'http://riddl.org/ns/common-patterns/properties/1.0'
    if doc.root.qname.name == 'testset'
      doc.find('//attributes | //endpoints | //dataelements | //positions | //transformation').each do |e|
        e.namespaces[nil] = 'http://cpee.org/ns/properties/2.0'
        e.namespace = nil
      end
    end
  end
end
