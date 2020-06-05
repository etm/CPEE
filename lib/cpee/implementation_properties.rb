module CPEE
  module Properties

    def self::implementation(id,opts)
      Proc.new do
        run CPEE::Properties::Get, id, opts if get
        on resource 'state' do
          run CPEE::Properties::GetState, id, opts if get
          on resource '@changed' do
            run CPEE::Properties::GetStateChanged, id, opts if get
          end
        end
      end
    end

    class Get < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        Riddl::Parameter::Complex.new('properties','application/xml',CPEE::Properties::extract_all(id,opts))
      end
    end #}}}
    class GetState < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        Riddl::Parameter::Simple.new('state',CPEE::Properties::extract_state(id,opts))
      end
    end #}}}
    class GetStateChanged < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        Riddl::Parameter::Simple.new('state',CPEE::Properties::extract_state_changed(id,opts))
      end
    end #}}}

    def self::extract_all(id,opts)
      doc = XML::Smart::open_unprotected(opts[:properties_init])
      doc.register_namespace 'p', 'http://cpee.org/ns/properties/2.0'
      if value = extract_state(id,opts)
        doc.find('/p:properties/p:state').first.text = value
      end
      if value = extract_state_changed(id,opts)
        doc.find('/p:properties/p:state/@changed').first.value = value
      end
      if value = extract_status_id(id,opts)
        doc.find('/p:properties/p:status/p:id').first.value = value
      end
      if value = extract_status_message(id,opts)
        doc.find('/p:properties/p:status/p:message').first.value = value
      end
      %w{dataelements endpoints attributes}.each do |item|
        values = extract_list(item,id,opts)
        if values
          des = doc.find("/p:properties/p:#{item}").first
          values.each{ |de| des.add(*de) }
        end
      end
      doc.to_s
    end

    def self::extract_state(id,opts)
      opts[:redis].get("instance:#{id}/state")
    end
    def self::extract_state_changed(id,opts)
      opts[:redis].get("instance:#{id}/state/@changed")
    end
    def self::extract_status_id(id,opts)
      opts[:redis].get("instance:#{id}/status/id")
    end
    def self::extract_status_message(id,opts)
      opts[:redis].get("instance:#{id}/status/message")
    end
    def self::extract_list(item,id,opts)
      opts[:redis].keys("instance:#{id}/#{item}/*").map do |e|
        [File.basename(e),opts[:redis].get(e)]
      end
    end
  end
end
