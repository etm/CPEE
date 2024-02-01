# This file is part of CPEE.
#
# CPEE is free software: you can redistribute it and/or modify it under the terms
# of the GNU General Public License as published by the Free Software Foundation,
# either version 3 of the License, or (at your option) any later version.
#
# CPEE is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
# PARTICULAR PURPOSE.  See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along with
# CPEE (file COPYING in the main directory).  If not, see
# <http://www.gnu.org/licenses/>.

require_relative 'attributes_helper'
require_relative 'fail'
require_relative 'value_helper'
require 'json'
require 'erb'
require 'yaml'

Encoding.default_external = 'UTF-8'

module CPEE
  module Properties

    def self::implementation(id,opts)
      Proc.new do
        if CPEE::Persistence::exists?(id,opts)
          run CPEE::Properties::Get, id, opts if get
          run CPEE::Properties::Patch, id, opts if patch 'set-some-properties'
          run CPEE::Properties::Put, id, opts if put 'set-some-properties'
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
          on resource 'executionhandler' do
            run CPEE::Properties::GetExecutionHandler, id, opts if get
            run CPEE::Properties::PutExecutionHandler, id, opts if put 'executionhandler'
          end
          on resource 'positions' do
            run CPEE::Properties::GetPositions, id, opts if get
            run CPEE::Properties::PatchPositions, id, opts if patch 'positions'
            run CPEE::Properties::PutPositions, id, opts if put 'positions'
            run CPEE::Properties::PostPositions, id, opts if post 'position'
            on resource do
              run CPEE::Properties::GetDetail, 'positions', id, opts if get
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
        else
          run CPEE::FAIL
        end
      end
    end

    class Get < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        doc = XML::Smart::open_unprotected(opts[:properties_empty])
        doc.register_namespace 'p', 'http://cpee.org/ns/properties/2.0'
        doc.find('/p:properties/p:state').first.text = CPEE::Persistence::extract_item(id,opts,'state')
        doc.find('/p:properties/p:state/@changed').first.value = CPEE::Persistence::extract_item(id,opts,'state/@changed')
        doc.find('/p:properties/p:status/p:id').first.text = CPEE::Persistence::extract_item(id,opts,'status/id')
        doc.find('/p:properties/p:status/p:message').first.text = CPEE::Persistence::extract_item(id,opts,'status/message')
        %w{dataelements endpoints attributes}.each do |item|
          des = doc.find("/p:properties/p:#{item}").first
          CPEE::Persistence::extract_list(id,opts,item).each{ |de| des.add(*de) }
        end
        des = doc.find("/p:properties/p:positions").first
        CPEE::Persistence::extract_set(id,opts,'positions').each do |de|
          node = des.add(*de)
          if pt = CPEE::Persistence::extract_item(id,opts,File.join('positions',de[0],'@passthrough'))
            node.attributes['passthrough'] = pt
          end
        end
        doc.find('/p:properties/p:dsl').first.text = CPEE::Persistence::extract_item(id,opts,'dsl')
        if val = CPEE::Persistence::extract_item(id,opts,'dslx') #{{{
          doc.find('/p:properties/p:dslx').first.add XML::Smart::string(val).root rescue nil
        end #}}}
        if val = CPEE::Persistence::extract_item(id,opts,'description') #{{{
          doc.find('/p:properties/p:description').first.add XML::Smart::string(val).root rescue nil
        end #}}}
        doc.find('/p:properties/p:transformation/p:description').first.text = CPEE::Persistence::extract_item(id,opts,'transformation/description')
        doc.find('/p:properties/p:transformation/p:dataelements').first.text = CPEE::Persistence::extract_item(id,opts,'transformation/dataelements')
        doc.find('/p:properties/p:transformation/p:endpoints').first.text = CPEE::Persistence::extract_item(id,opts,'transformation/endpoints')
        doc.find('/p:properties/p:transformation/p:description/@type').first.text = CPEE::Persistence::extract_item(id,opts,'transformation/description/@type')
        doc.find('/p:properties/p:transformation/p:dataelements/@type').first.text = CPEE::Persistence::extract_item(id,opts,'transformation/dataelements/@type')
        doc.find('/p:properties/p:transformation/p:endpoints/@type').first.text = CPEE::Persistence::extract_item(id,opts,'transformation/endpoints/@type')
        Riddl::Parameter::Complex.new('properties','application/xml',doc.to_s)
      end
    end #}}}
    class Patch < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        if opts[:statemachine].readonly? id
          @status = 400
        else
          doc = XML::Smart::string(@p[0].value.read)
          doc.register_namespace 'p', 'http://cpee.org/ns/properties/2.0'
          if (node = doc.find('/p:properties/p:status')).any?
            CPEE::Properties::PutStatus::set id, opts, node.first.dump
          end
          if (node = doc.find('/p:properties/p:executionhandler')).any?
            CPEE::Properties::PutExecutionHandler::set id, opts, node.first.text
          end

          %w{dataelements endpoints attributes}.each do |item|
            if (node = doc.find('/p:properties/p:' + item)).any?
              CPEE::Properties::PatchItems::set item, id, opts, node.first.dump
            end
          end

          if (node = doc.find('/p:properties/p:transformation')).any?
            CPEE::Properties::PutTransformation::set id, opts, node.first.dump
          end
          if (node = doc.find('/p:properties/p:description/*')).any?
            CPEE::Properties::PutDescription::set id, opts, node.first.dump
          end

          if (node = doc.find('/p:properties/p:positions')).any?
            if node.first.find('p:*').any?
              CPEE::Properties::PatchPositions::set id, opts, node.first.dump
            end
          end

          if (node = doc.find('/p:properties/p:state')).any?
            CPEE::Properties::PutState::run id, opts, node.first.text
          end
        end
      end
    end #}}}
    class Put < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        if opts[:statemachine].readonly? id
          @status = 400
        else
          doc = XML::Smart::string(@p[0].value.read)
          doc.register_namespace 'p', 'http://cpee.org/ns/properties/2.0'
          if (node = doc.find('/p:properties/p:status')).any?
            CPEE::Properties::PutStatus::set id, opts, node.first.dump
          end
          if (node = doc.find('/p:properties/p:executionhandler')).any?
            CPEE::Properties::PutExecutionHandler::set id, opts, node.first.text
          end

          %w{dataelements endpoints attributes}.each do |item|
            if (node = doc.find('/p:properties/p:' + item)).any?
              CPEE::Properties::PutItems::set item, id, opts, node.first.dump
            end
          end

          if (node = doc.find('/p:properties/p:transformation')).any?
            CPEE::Properties::PutTransformation::set id, opts, node.first.dump
          end
          if (node = doc.find('/p:properties/p:description/*')).any?
            CPEE::Properties::PutDescription::set id, opts, node.first.dump
          end

          if (node = doc.find('/p:properties/p:positions')).any?
            if node.first.find('p:*').any?
              CPEE::Properties::PutPositions::set id, opts, node.first.dump
            end
          end

          if (node = doc.find('/p:properties/p:state')).any?
            CPEE::Properties::PutState::run id, opts, node.first.text
          end
        end
      end
    end #}}}
    class GetState < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        Riddl::Parameter::Simple.new('value',CPEE::Persistence::extract_item(id,opts,'state'))
      end
    end #}}}
    class PutState < Riddl::Implementation #{{{
      def self::set(id,opts,state)
        CPEE::Persistence::set_item(id,opts,'state',:state => state, :attributes => CPEE::Persistence::extract_list(id,opts,'attributes').to_h)
      end

      def self::run(id,opts,state)
        case state
          when 'running'
            seh = Object.const_get('CPEE::ExecutionHandler::' + CPEE::Persistence::extract_item(id,opts,'executionhandler').capitalize)
            seh::prepare(id,opts)
            seh::run(id,opts)
          when 'stopping'
            seh = Object.const_get('CPEE::ExecutionHandler::' + CPEE::Persistence::extract_item(id,opts,'executionhandler').capitalize)
            if seh::stop(id,opts) # process is not running anyway, so change redis
              PutState::set id, opts, 'stopped'
            end
          else
            PutState::set id, opts, state
        end
      end

      def response
        id = @a[0]
        opts = @a[1]
        state = @p[0].value
        if opts[:statemachine].setable? id, state
          PutState::run id, opts, state
        else
          @status = 422
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
        Riddl::Parameter::Simple.new('state',CPEE::Persistence::extract_item(id,opts,'state/@changed'))
      end
    end #}}}
    class GetStatus < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        doc = XML::Smart::open_unprotected(opts[:properties_empty])
        doc.register_namespace 'p', 'http://cpee.org/ns/properties/2.0'
        des = doc.find('/p:properties/p:status').first
        des.find('p:id').first.text = CPEE::Persistence::extract_item(id,opts,'status/id')
        des.find('p:message').first.text = CPEE::Persistence::extract_item(id,opts,'status/message')
        Riddl::Parameter::Complex.new('status','text/xml',des.to_doc.to_s)
      end
    end #}}}
    class PutStatus < Riddl::Implementation #{{{
      def self::set(id,opts,xml)
        doc = XML::Smart::string(xml)
        doc.register_namespace 'p', 'http://cpee.org/ns/properties/2.0'
        CPEE::Persistence::set_item(id,opts,'status',:id => doc.find('string(/p:status/p:id)').to_i, :message => doc.find('string(/p:status/p:message)'))
      end

      def response
        id = @a[0]
        opts = @a[1]
        if opts[:statemachine].readonly? id
          @status = 422 # semantic error
        else
          PutStatus::set id, opts, @p[0].value.read
        end
        nil
      end
    end #}}}
    class GetStatusID < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        Riddl::Parameter::Simple.new('value',CPEE::Persistence::extract_item(id,opts,'status/id'))
      end
    end #}}}
    class GetStatusMessage < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        Riddl::Parameter::Simple.new('value',CPEE::Persistence::extract_item(id,opts,'status/message'))
      end
    end #}}}
    class GetExecutionHandler < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        Riddl::Parameter::Simple.new('value',CPEE::Persistence::extract_item(id,opts,'executionhandler'))
      end
    end #}}}
    class PutExecutionHandler < Riddl::Implementation #{{{
      def self::set(id,opts,hw)
        CPEE::Persistence::set_item(id,opts,'executionhandler',:executionhandler => hw)
      end
      def response
        id = @a[0]
        opts = @a[1]
        if opts[:statemachine].readonly? id
          @status = 423
        else
          PutExecutionHandler::set(id,opts,@p[0].value)
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
        CPEE::Persistence::extract_list(id,opts,item).each{ |de| des.add(*de) }
        Riddl::Parameter::Complex.new(item,'text/xml',des.to_doc.to_s)
      end
    end #}}}
    class PatchItems < Riddl::Implementation #{{{
      def self::set_hash(item, id, opts, val)
        CPEE::Persistence::set_list(id,opts,item,val)
      end
      def self::set(item, id, opts, xml)
        doc = XML::Smart::string(xml)
        val = doc.find("/*/*").map do |ele|
          [ele.qname.name, ele.text]
        end.to_h
        CPEE::Persistence::set_list(id,opts,item,val)
      end

      def response
        item = @a[0]
        id = @a[1]
        opts = @a[2]
        if opts[:statemachine].readonly? id
          @status = 423
        else
          begin
            PatchItems::set(item,id,opts,@p[0].value.read)
          rescue
            @status = 400
          end
        end
        nil
      end
    end #}}}
    class PutItems < Riddl::Implementation #{{{
      def self::set(item,id,opts,xml)
        doc = XML::Smart::string(xml)
        val = {}
        doc.find("/*/*").each do |ele|
          val[ele.qname.name] = ele.text unless val.has_key?(ele.qname.name)
        end
        oldkeys = CPEE::Persistence::extract_list(id,opts,item).to_h.keys
        newkeys = val.keys
        del = oldkeys - newkeys
        CPEE::Persistence::set_list(id,opts,item,val,del)
      end

      def response
        item = @a[0]
        id = @a[1]
        opts = @a[2]
        if opts[:statemachine].readonly? id
          @status = 423
        else
          begin
            PutItems::set(item,id,opts,@p[0].value.read)
          rescue
            @status = 400
          end
        end
        nil
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
            if not CPEE::Persistence::extract_item(id,opts,File.join(@r.first,val.keys.first))
              CPEE::Persistence::set_list(id,opts,item,val)
              Riddl::Parameter::Simple.new('id',val.keys.first)
            else
              @status= 409
            end
          rescue => e
            @status = 400
          end
        end
        nil
      end
    end #}}}
    class GetItem < Riddl::Implementation #{{{
      def response
        item = @a[0]
        id = @a[1]
        opts = @a[2]
        if val = CPEE::Persistence::extract_item(id,opts,@r.join('/'))
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
        if CPEE::Persistence::extract_item(id,opts,@r.join('/'))
          CPEE::Persistence::set_list(id,opts,item,val)
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
          if CPEE::Persistence::extract_item(id,opts,@r.join('/'))
            CPEE::Persistence::set_list(id,opts,item,val,val.keys)
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
        if val = CPEE::Persistence::extract_item(id,opts,@r.join('/'))
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
        CPEE::Persistence::extract_set(id,opts,'positions').each do |de|
          node = des.add(*de)
          if pt = CPEE::Persistence::extract_item(id,opts,File.join('positions',de[0],'@passthrough'))
            node.attributes['passthrough'] = pt
          end
        end
        Riddl::Parameter::Complex.new('positions','text/xml',des.to_doc.to_s)
      end
    end #}}}
    class PatchPositions < Riddl::Implementation #{{{
      def self::set(id,opts,xml)
        doc = XML::Smart::string(xml)
        content = {}
        doc.find("/*/*").map do |ele|
          val = { 'position' => ele.qname.name }
          val['passthrough'] = ele.attributes['passthrough'] if ele.attributes['passthrough']
          content[ele.text] ||= []
          content[ele.text] << val
        end
        CPEE::Persistence::set_item(id,opts,'position',content)
      end

      def response
        id = @a[0]
        opts = @a[1]
        if opts[:statemachine].readonly? id
          @status = 423
        else
          begin
            PatchPositions::set(id,opts,@p[0].value.read)
          rescue => e
            @status = 400
          end
        end
        nil
      end
    end #}}}
    class PutPositions < Riddl::Implementation #{{{
      def PutPositions::set(id,opts,xml)
        doc = XML::Smart::string(xml)
        content = {}
        newkeys = []
        doc.find("/*/*").map do |ele|
          val = { 'position' => ele.qname.name }
          val['passthrough'] = ele.attributes['passthrough'] if ele.attributes['passthrough']
          content[ele.text] ||= []
          content[ele.text] << val
          newkeys << ele.qname.name
        end
        oldkeys = CPEE::Persistence::extract_set(id,opts,'positions').to_h.keys
        del = oldkeys - newkeys
        del.each do |key|
          val = { 'position' => key }
          content['unmark'] ||= []
          content['unmark'] << val
        end
        CPEE::Persistence::set_item(id,opts,'position',content)
      end

      def response
        id = @a[0]
        opts = @a[1]
        if opts[:statemachine].readonly? id
          @status = 423
        else
          begin
            PutPositions::set(id,opts,@p[0].value.read)
          rescue => e
            @status = 400
          end
        end
        nil
      end
    end #}}}
    class PostPositions < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        if opts[:statemachine].readonly? id
          @status = 423
        else
          begin
            doc = XML::Smart::string(@p[0].value.read)
            if not CPEE::Persistence::extract_item(id,opts,File.join('positions',doc.root.qname.name))
              content = {}
              content[doc.root.text] = [{ 'position' => doc.root.qname.name }]
              content[doc.root.text][0]['passthrough'] = doc.root.attributes['passthrough'] if doc.root.attributes['passthrough']
              CPEE::Persistence::set_item(id,opts,'position',content)
            else
              @status= 409
            end
            Riddl::Parameter::Simple.new('id',doc.root.qname.name)
          rescue => e
            @status = 400
          end
        end
        nil
      end
    end #}}}
    class GetDetail < Riddl::Implementation #{{{
      def response
        item = @a[0]
        id = @a[1]
        opts = @a[2]
        if val = CPEE::Persistence::extract_item(id,opts,@r.join('/'))
          Riddl::Parameter::Simple.new('value',val)
        else
          @status = 404
        end
      end
    end #}}}
    class SetDetail < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        if CPEE::Persistence::extract_item(id,opts,@r.join('/'))
          CPEE::Persistence::set_item(id,opts,'position',@p[0].value => [ { 'position' => @r.last } ])
        else
          @status = 404
        end
        nil
      end
    end #}}}
    class DelDetail < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        if CPEE::Persistence::extract_item(id,opts,@r.join('/'))
          CPEE::Persistence::set_position(id,opts,'position','unmark' => [ { 'position' => @r.last } ])
        else
          @status = 404
        end
        nil
      end
    end #}}}
    class GetPt < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        if val = CPEE::Persistence::extract_item(id,opts,@r.join('/'))
          Riddl::Parameter::Simple.new('value',val)
        else
          @status = 404
        end
      end
    end #}}}

    class PutDescription < Riddl::Implementation #{{{
      def self::transform(descxml,tdesc,tdesctype,tdata,tdatatype,tendp,tendptype,hw,opts) #{{{
        desc = XML::Smart::string(descxml)
        desc.register_namespace  'p', 'http://cpee.org/ns/description/1.0'

        dslx = nil
        dsl = nil
        de = {}
        ep = {}

        if desc.root.children.empty?
          tdesctype = tdatatype = tendptype = 'clean'
        end

        ### description transformation, including dslx to dsl
        addit = if tdesctype == 'copy' || tdesc.empty?
          desc
        elsif tdesctype == 'rest' && !tdesc.empty?
          srv = Riddl::Client.interface(tdesc,opts[:transformation_service])
          status, res = srv.post [
            Riddl::Parameter::Complex.new("description","text/xml",descxml),
            Riddl::Parameter::Simple.new("type","description")
          ]
          if status >= 200 && status < 300
            XML::Smart::string(res[0].value.read).root
          else
            raise 'Could not extract dslx'
          end
        elsif tdesctype == 'xslt' && !tdesc.empty?
          trans = XML::Smart::open_unprotected(tdesc)
          desc.transform_with(trans).root
        elsif tdesctype == 'clean'
          XML::Smart::open_unprotected(opts[:empty_dslx]).root
        else
          nil
        end
        unless addit.nil?
          dslx = addit.to_s
          dsl = Object.const_get('CPEE::ExecutionHandler::' + hw.capitalize)::dslx_to_dsl(addit)
        end

        ### dataelements extraction
        addit = if tdatatype == 'rest' && !tdata.empty?
          srv = Riddl::Client.interface(tdata,@opts[:transformation_service])
          status, res = srv.post [
            Riddl::Parameter::Complex.new("description","text/xml",descxml),
            Riddl::Parameter::Simple.new("type","dataelements")
          ]
          if status >= 200 && status < 300
            res
          else
            raise 'Could not extract dataelements'
          end
        elsif tdatatype == 'xslt' && !tdata.empty?
          trans = XML::Smart::open_unprotected(tdata)
          desc.transform_with(trans)
        elsif tdatatype == 'clean'
          []
        else
          nil
        end
        unless addit.nil?
          addit.each_slice(2).each do |k,v|
            de[k.value.to_sym] = v.value
          end
        end

        ### endpoints extraction
        addit = if tendptype == 'rest' && !tdata.empty?
          srv = Riddl::Client.interface(tendp,@opts[:transformation_service])
          status, res = srv.post [
            Riddl::Parameter::Complex.new("description","text/xml",descxml),
            Riddl::Parameter::Simple.new("type","endpoints")
          ]
          if status >= 200 && status < 300
            res
          else
            raise 'Could not extract endpoints'
          end
        elsif tendptype == 'xslt' && !tdata.empty?
          trans = XML::Smart::open_unprotected(tendp.text)
          desc.transform_with(trans)
        elsif tendptype == 'clean'
          []
        else
          nil
        end
        unless addit.nil?
          addit.each_slice(2).each do |k,v|
            ep[k.value.to_sym] = v.value
          end
        end

        [dslx, dsl, de, ep]
      end #}}}

      def self::set(id,opts,xml)
        dslx, dsl, de, ep = PutDescription::transform(
          xml,
          CPEE::Persistence::extract_item(id,opts,'transformation/description'),
          CPEE::Persistence::extract_item(id,opts,'transformation/description/@type'),
          CPEE::Persistence::extract_item(id,opts,'transformation/dataelements'),
          CPEE::Persistence::extract_item(id,opts,'transformation/dataelements/@type'),
          CPEE::Persistence::extract_item(id,opts,'transformation/endpoints'),
          CPEE::Persistence::extract_item(id,opts,'transformation/endpoints/@type'),
          CPEE::Persistence::extract_item(id,opts,'executionhandler'),
          opts
        )
        CPEE::Persistence::set_item(id,opts,'description',
          :description => xml,
          :dslx => dslx,
          :dsl => dsl
        )
        PatchItems::set_hash('dataelements',id,opts,de) unless de.empty?
        PatchItems::set_hash('dataelements',id,opts,ep) unless ep.empty?
      end

      def response
        id = @a[0]
        opts = @a[1]
        if opts[:statemachine].readonly? id
          @status = 422 # semantic error
        else
          begin
            # force-encoding because johannes managed to sneak in ascii special characters. why the browser is not sanitizing it is beyond me.
            PutDescription::set(id,opts,@p[0].value.read.force_encoding('UTF-8'))
          rescue => e
            puts e.message
            puts e.backtrace
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
        des.find('p:description').first.text = CPEE::Persistence::extract_item(id,opts,'transformation/description')
        des.find('p:dataelements').first.text = CPEE::Persistence::extract_item(id,opts,'transformation/dataelements')
        des.find('p:endpoints').first.text = CPEE::Persistence::extract_item(id,opts,'transformation/endpoints')
        des.find('p:description/@type').first.text = CPEE::Persistence::extract_item(id,opts,'transformation/description/@type')
        des.find('p:dataelements/@type').first.text = CPEE::Persistence::extract_item(id,opts,'transformation/dataelements/@type')
        des.find('p:endpoints/@type').first.text = CPEE::Persistence::extract_item(id,opts,'transformation/endpoints/@type')
        Riddl::Parameter::Complex.new('status','text/xml',des.to_doc.to_s)
      end
    end #}}}
    class PutTransformation < Riddl::Implementation #{{{
      def self::set(id,opts,xml)
        doc = XML::Smart::string(xml)
        doc.register_namespace 'p', 'http://cpee.org/ns/properties/2.0'
        CPEE::Persistence::set_item(id,opts,'transformation',
          :description => doc.find('string(/p:transformation/p:description)'),
          :description_type => doc.find('string(/p:transformation/p:description/@type)'),
          :dataelements =>doc.find('string(/p:transformation/p:dataelements)'),
          :dataelements_type => doc.find('string(/p:transformation/p:dataelements/@type)'),
          :endpoints =>doc.find('string(/p:transformation/p:endpoints)'),
          :endpoints_type => doc.find('string(/p:transformation/p:endpoints/@type)')
        )
      end
      def response
        id = @a[0]
        opts = @a[1]
        if opts[:statemachine].readonly? id
          @status = 422 # semantic error
        else
          PutTransformation::set(id,opts,@p[0].value.read)
        end
        nil
      end
    end #}}}

  end
end
