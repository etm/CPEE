require_relative 'attributes_helper'
require 'json'

module CPEE
  module Properties

    def self::implementation(id,opts)
      Proc.new do
        run CPEE::Properties::Get, id, opts if get
        # TODO PUT and PATCH
        on resource 'state' do
          run CPEE::Properties::GetStateMachine, id, opts if get 'machine'
          run CPEE::Properties::GetState, id, opts if get
          run CPEE::Properties::PutState, id, opts if put 'state'
          on resource '@changed' do
            run CPEE::Properties::GetStateChanged, id, opts if get
          end
        end
        on resource 'status' do
          run CPEE::Properties::GetStatus, id, opts if get
          run CPEE::Properties::PutStatus, id, opts if put 'status'
          on resource 'id' do
            run CPEE::Properties::GetStatusID, id, opts if get
          end
          on resource 'message' do
            run CPEE::Properties::GetStatusMessage, id, opts if get
          end
        end
        on resource 'handlerwrapper' do
          run CPEE::Properties::GetHandlerWrapper, id, opts if get
          run CPEE::Properties::PutHandlerWrapper, id, opts if put 'handlerwrapper'
        end
        on resource 'positions' do
          run CPEE::Properties::GetPositions, id, opts if get
          run CPEE::Properties::PatchPositions, id, opts if patch 'positions'
          run CPEE::Properties::PutPositions, id, opts if put 'positions'
          run CPEE::Properties::PostPositions, id, opts if post 'position'
          on resource do
            run CPEE::Properties::GetDetail, id, opts if get
            run CPEE::Properties::SetDetail, id, opts if put 'detail'
            run CPEE::Properties::DelDetail, id, opts if delete
            on resource '@passthrough' do
              run CPEE::Properties::GetPt, id, opts if get
            end
          end
        end
        %w{dataelements endpoints attributes}.each do |ele|
          on resource ele do
            run CPEE::Properties::GetItems, ele, id, opts if get
            run CPEE::Properties::PatchItems, ele, id, opts if patch ele
            run CPEE::Properties::PutItems, ele, id, opts if put ele
            run CPEE::Properties::PostItem, ele, id, opts if post ele[0..-2]
            on resource do
              run CPEE::Properties::GetItem, ele, id, opts if get
              run CPEE::Properties::SetItem, ele, id, opts if put 'string'
              run CPEE::Properties::DelItem, ele, id, opts if delete
            end
          end
        end
        on resource 'dsl' do
          run CPEE::Properties::GetComplex, 'dsl', 'text/plain', id, opts if get
        end
        on resource 'dslx' do
          run CPEE::Properties::GetComplex, 'dslx', 'text/xml', id, opts if get
        end
        on resource 'description' do
          run CPEE::Properties::GetComplex, 'description', 'text/xml', id, opts if get
          run CPEE::Properties::PutDescription, id, opts if put 'description'
        end
        on resource 'transformation' do
          run CPEE::Properties::GetTransformation, id, opts if get
          run CPEE::Properties::PutTransformation, id, opts if put 'transformation'
        end
      end
    end

    class Get < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        doc = XML::Smart::open_unprotected(opts[:properties_empty])
        doc.register_namespace 'p', 'http://cpee.org/ns/properties/2.0'
        doc.find('/p:properties/p:state').first.text = CPEE::Properties::extract_item(id,opts,'state')
        doc.find('/p:properties/p:state/@changed').first.value = CPEE::Properties::extract_item(id,opts,'state/@changed')
        doc.find('/p:properties/p:status/p:id').first.text = CPEE::Properties::extract_item(id,opts,'status/id')
        doc.find('/p:properties/p:status/p:message').first.text = CPEE::Properties::extract_item(id,opts,'status/message')
        %w{dataelements endpoints attributes}.each do |item|
          des = doc.find("/p:properties/p:#{item}").first
          CPEE::Properties::extract_list(id,opts,item).each{ |de| des.add(*de) }
        end
        des = doc.find("/p:properties/p:positions").first
        CPEE::Properties::extract_list(id,opts,'positions').each do |de|
          node = des.add(*de)
          if pt = CPEE::Properties::extract_item(id,opts,File.join('positions',de[0],'@passthrough'))
            node.attributes['passthrough'] = pt
          end
        end
        doc.find('/p:properties/p:dsl').first.text = CPEE::Properties::extract_item(id,opts,'dsl')
        if val = CPEE::Properties::extract_item(id,opts,'dslx') #{{{
          doc.find('/p:properties/p:dslx').first.add XML::Smart::string(val).root rescue nil
        end #}}}
        if val = CPEE::Properties::extract_item(id,opts,'description') #{{{
          doc.find('/p:properties/p:description').first.add XML::Smart::string(val).root rescue nil
        end #}}}
        doc.find('/p:properties/p:transformation/p:description').first.text = CPEE::Properties::extract_item(id,opts,'transformation/description')
        doc.find('/p:properties/p:transformation/p:dataelements').first.text = CPEE::Properties::extract_item(id,opts,'transformation/dataelements')
        doc.find('/p:properties/p:transformation/p:endpoints').first.text = CPEE::Properties::extract_item(id,opts,'transformation/endpoints')
        doc.find('/p:properties/p:transformation/p:description/@type').first.text = CPEE::Properties::extract_item(id,opts,'transformation/description/@type')
        doc.find('/p:properties/p:transformation/p:dataelements/@type').first.text = CPEE::Properties::extract_item(id,opts,'transformation/dataelements/@type')
        doc.find('/p:properties/p:transformation/p:endpoints/@type').first.text = CPEE::Properties::extract_item(id,opts,'transformation/endpoints/@type')
        Riddl::Parameter::Complex.new('properties','application/xml',doc.to_s)
      end
    end #}}}
    class GetState < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        Riddl::Parameter::Simple.new('value',CPEE::Properties::extract_item(id,opts,'state'))
      end
    end #}}}
    class PutState < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        if opts[:statemachine].setable? id, @p[0].value
          CPEE::Properties::set_item(id,opts,'state',:state => @p[0].value)
        else
          @status = 422 # semantic error
        end
        nil
      end
    end #}}}
    class GetStateMachine < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        Riddl::Parameter::Complex.new('statemachine','text/xml',File.read(opts[:states]))
      end
    end #}}}
    class GetStateChanged < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        Riddl::Parameter::Simple.new('state',CPEE::Properties::extract_item(id,opts,'state/@changed'))
      end
    end #}}}
    class GetStatus < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        doc = XML::Smart::open_unprotected(opts[:properties_empty])
        doc.register_namespace 'p', 'http://cpee.org/ns/properties/2.0'
        des = doc.find('/p:properties/p:status').first
        des.find('p:id').first.text = CPEE::Properties::extract_item(id,opts,'status/id')
        des.find('p:message').first.text = CPEE::Properties::extract_item(id,opts,'status/message')
        Riddl::Parameter::Complex.new('status','text/xml',des.to_doc.to_s)
      end
    end #}}}
    class PutStatus < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        doc = XML::Smart::string(@p[0].value.read)
        doc.register_namespace 'p', 'http://cpee.org/ns/properties/2.0'
        if opts[:statemachine].readonly? id
          @status = 422 # semantic error
        else
          CPEE::Properties::set_item(id,opts,'status',:id => doc.find('string(/p:status/p:id)').to_i, :message => doc.find('string(/p:status/p:message)'))
        end
        nil
      end
    end #}}}
    class GetStatusID < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        Riddl::Parameter::Simple.new('value',CPEE::Properties::extract_item(id,opts,'status/id'))
      end
    end #}}}
    class GetStatusMessage < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        Riddl::Parameter::Simple.new('value',CPEE::Properties::extract_item(id,opts,'status/message'))
      end
    end #}}}
    class GetHandlerWrapper < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        Riddl::Parameter::Simple.new('value',CPEE::Properties::extract_item(id,opts,'handlerwrapper'))
      end
    end #}}}
    class PutHandlerWrapper < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        if opts[:statemachine].readonly? id
          @status = 423
        else
          CPEE::Properties::set_item(id,opts,'handlerwrapper',:handlerwrapper => @p[0].value)
        end
        nil
      end
    end #}}}
    class GetItems < Riddl::Implementation #{{{
      def response
        item = @a[0]
        id = @a[1]
        opts = @a[2]
        doc = XML::Smart::open_unprotected(opts[:properties_empty])
        doc.register_namespace 'p', 'http://cpee.org/ns/properties/2.0'
        des = doc.find("/p:properties/p:#{item}").first
        CPEE::Properties::extract_list(id,opts,item).each{ |de| des.add(*de) }
        Riddl::Parameter::Complex.new(item,'text/xml',des.to_doc.to_s)
      end
    end #}}}
    class PatchItems < Riddl::Implementation #{{{
      def response
        item = @a[0]
        id = @a[1]
        opts = @a[2]
        if opts[:statemachine].readonly? id
          @status = 423
        else
          begin
            doc = XML::Smart::string(@p[0].value.read)
            val = doc.find("/*/*").map do |ele|
              [ele.qname.name, ele.text]
            end.to_h
            CPEE::Properties::set_list(id,opts,item,val)
            nil
          rescue
            @status = 400
          end
        end
      end
    end #}}}
    class PutItems < Riddl::Implementation #{{{
      def response
        item = @a[0]
        id = @a[1]
        opts = @a[2]
        if opts[:statemachine].readonly? id
          @status = 423
        else
          begin
            doc = XML::Smart::string(@p[0].value.read)
            val = doc.find("/*/*").map do |ele|
              [ele.qname.name, ele.text]
            end.to_h
            oldkeys = CPEE::Properties::extract_list(id,opts,item).to_h.keys
            newkeys = val.keys
            del = oldkeys - newkeys
            CPEE::Properties::set_list(id,opts,item,val,del)
            nil
          rescue
            @status = 400
          end
        end
      end
    end #}}}
    class PostItem < Riddl::Implementation #{{{
      def response
        item = @a[0]
        id = @a[1]
        opts = @a[2]
        if opts[:statemachine].readonly? id
          @status = 423
        else
          begin
            doc = XML::Smart::string(@p[0].value.read)
            val = doc.find("/*").map do |ele|
              [ele.qname.name, ele.text]
            end.to_h
            if not CPEE::Properties::extract_item(id,opts,File.join(@r.first,val.keys.first))
              CPEE::Properties::set_list(id,opts,item,val)
              Riddl::Parameter::Simple.new('id',val.keys.first)
            else
              @status= 409
            end
          rescue => e
            @status = 400
          end
        end
      end
    end #}}}
    class GetItem < Riddl::Implementation #{{{
      def response
        item = @a[0]
        id = @a[1]
        opts = @a[2]
        if val = CPEE::Properties::extract_item(id,opts,@r.join('/'))
          Riddl::Parameter::Simple.new('value',val)
        else
          @status = 404
        end
      end
    end #}}}
    class SetItem < Riddl::Implementation #{{{
      def response
        item = @a[0]
        id = @a[1]
        opts = @a[2]
        val = { @r.last => @p[0].value }
        if CPEE::Properties::extract_item(id,opts,@r.join('/'))
          CPEE::Properties::set_list(id,opts,item,val)
        else
          @status = 404
        end
        nil
      end
    end #}}}
    class DelItem < Riddl::Implementation #{{{
      def response
        item = @a[0]
        id = @a[1]
        opts = @a[2]
        val = { @r.last => nil }
        if opts[:statemachine].readonly? id
          @status = 423
        else
          if CPEE::Properties::extract_item(id,opts,@r.join('/'))
            CPEE::Properties::set_list(id,opts,item,val,val.keys)
          else
            @status = 404
          end
        end
        nil
      end
    end #}}}

    class GetComplex < Riddl::Implementation #{{{
      def response
        item = @a[0]
        mime = @a[1]
        id = @a[2]
        opts = @a[3]
        if val = CPEE::Properties::extract_item(id,opts,@r.join('/'))
          Riddl::Parameter::Complex.new(item,mime,val)
        else
          @status = 404
        end
      end
    end #}}}

    class GetPositions < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        doc = XML::Smart::open_unprotected(opts[:properties_empty])
        doc.register_namespace 'p', 'http://cpee.org/ns/properties/2.0'
        des = doc.find("/p:properties/p:positions").first
        CPEE::Properties::extract_list(id,opts,'positions').each do |de|
          node = des.add(*de)
          if pt = CPEE::Properties::extract_item(id,opts,File.join('positions',de[0],'@passthrough'))
            node.attributes['passthrough'] = pt
          end
        end
        Riddl::Parameter::Complex.new('positions','text/xml',des.to_doc.to_s)
      end
    end #}}}
    class PatchPositions < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        if opts[:statemachine].readonly? id
          @status = 423
        else
          begin
            doc = XML::Smart::string(@p[0].value.read)
            val = doc.find("/*/*").map do |ele|
              [ele.qname.name, ele.text]
            end.to_h
            CPEE::Properties::set_list(id,opts,item,val)
            nil
          rescue
            @status = 400
          end
        end
      end
    end #}}}
    class PutPositions < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        if opts[:statemachine].readonly? id
          @status = 423
        else
          begin
            doc = XML::Smart::string(@p[0].value.read)
            val = doc.find("/*/*").map do |ele|
              [ele.qname.name, ele.text, ele.attributes['passthrough']]
            end.to_h
            oldkeys = CPEE::Properties::extract_list(id,opts,item).to_h.keys
            newkeys = val.keys
            del = oldkeys - newkeys
            CPEE::Properties::set_list(id,opts,item,val,del)
            nil
          rescue
            @status = 400
          end
        end
      end
    end #}}}
    class PostPosition < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        if opts[:statemachine].readonly? id
          @status = 423
        else
          begin
            doc = XML::Smart::string(@p[0].value.read)
            val = doc.find("/*").map do |ele|
              [ele.qname.name, ele.text]
            end.to_h
            if not CPEE::Properties::extract_item(id,opts,File.join(@r.first,val.keys.first))
              CPEE::Properties::set_list(id,opts,item,val)
              Riddl::Parameter::Simple.new('id',val.keys.first)
            else
              @status= 409
            end
          rescue => e
            @status = 400
          end
        end
      end
    end #}}}
    class GetPosition < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        if val = CPEE::Properties::extract_item(id,opts,@r.join('/'))
          Riddl::Parameter::Simple.new('value',val)
        else
          @status = 404
        end
      end
    end #}}}
    class SetPosition < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        val = { @r.last => @p[0].value }
        if CPEE::Properties::extract_item(id,opts,@r.join('/'))
          CPEE::Properties::set_list(id,opts,item,val)
        else
          @status = 404
        end
        nil
      end
    end #}}}
    class DelPosition < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        val = { @r.last => nil }
        if opts[:statemachine].readonly? id
          @status = 423
        else
          if CPEE::Properties::extract_item(id,opts,@r.join('/'))
            CPEE::Properties::set_list(id,opts,item,val,val.keys)
          else
            @status = 404
          end
        end
        nil
      end
    end #}}}
    class GetPD < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        if val = CPEE::Properties::extract_item(id,opts,@r.join('/'))
          Riddl::Parameter::Simple.new('value',val)
        else
          @status = 404
        end
      end
    end #}}}

    class PutDescription < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        if opts[:statemachine].readonly? id
          @status = 422 # semantic error
        else
          begin
            CPEE::Properties::set_item(id,opts,'description',:description => XML::Smart.string(@p[0].value.read).to_s)
          rescue
            @status = 400
          end
        end
        nil
      end
    end #}}}

    class GetTransformation < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        doc = XML::Smart::open_unprotected(opts[:properties_empty])
        doc.register_namespace 'p', 'http://cpee.org/ns/properties/2.0'
        des = doc.find('/p:properties/p:transformation').first
        des.find('p:description').first.text = CPEE::Properties::extract_item(id,opts,'transformation/description')
        des.find('p:dataelements').first.text = CPEE::Properties::extract_item(id,opts,'transformation/dataelements')
        des.find('p:endpoints').first.text = CPEE::Properties::extract_item(id,opts,'transformation/endpoints')
        des.find('p:description/@type').first.text = CPEE::Properties::extract_item(id,opts,'transformation/description/@type')
        des.find('p:dataelements/@type').first.text = CPEE::Properties::extract_item(id,opts,'transformation/dataelements/@type')
        des.find('p:endpoints/@type').first.text = CPEE::Properties::extract_item(id,opts,'transformation/endpoints/@type')
        Riddl::Parameter::Complex.new('status','text/xml',des.to_doc.to_s)
      end
    end #}}}
    class PutTransformation < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        doc = XML::Smart::string(@p[0].value.read)
        doc.register_namespace 'p', 'http://cpee.org/ns/properties/2.0'
        if opts[:statemachine].readonly? id
          @status = 422 # semantic error
        else
          CPEE::Properties::set_item(id,opts,'status',:id => doc.find('string(/p:status/p:id)').to_i, :message => doc.find('string(/p:status/p:message)'))
        end
        nil
      end
    end #}}}

    def self::set_list(id,opts,item,values,deleted=[]) #{{{
      ah = AttributesHelper.new
      attributes = CPEE::Properties::extract_list(id,opts,'attributes').to_h
      dataelements = CPEE::Properties::extract_list(id,opts,'dataelements').to_h
      endpoints = CPEE::Properties::extract_list(id,opts,'endpoints').to_h
      CPEE::Notification::send_event(
        opts[:redis],
        File.join(item,'change'),
        id,
        {
          :instance_name => CPEE::Properties::extract_item(id,opts,'attributes/info'),
          :instance => id,
          :instance_uuid => CPEE::Properties::extract_item(id,opts,'attributes/uuid'),
          :changed => values.keys,
          :deleted => deleted,
          :values => values,
          :attributes => ah.translate(attributes,dataelements,endpoints),
          :timestamp => Time.now.xmlschema(3)
        }
      )
    end #}}}
    def self::set_item(id,opts,item,value) #{{{
      content = {
        :instance_name => CPEE::Properties::extract_item(id,opts,'attributes/info'),
        :instance => id,
        :instance_uuid => CPEE::Properties::extract_item(id,opts,'attributes/uuid'),
        :timestamp => Time.now.xmlschema(3)
      }
      value.each do |k,v|
        content[k.to_sym] = v
      end
      CPEE::Notification::send_event(
        opts[:redis],
        File.join(item,'change'),
        id,
        content
      )
    end #}}}

    def self::extract_item(id,opts,item) #{{{
      opts[:redis].get("instance:#{id}/#{item}")
    end #}}}
    def self::extract_list(id,opts,item) #{{{
      opts[:redis].smembers("instance:#{id}/#{item}").map do |e|
        [e,opts[:redis].get("instance:#{id}/#{item}/#{e}")]
      end
    end #}}}
  end
end
