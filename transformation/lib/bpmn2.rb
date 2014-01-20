require File.expand_path(File.dirname(__FILE__) + '/structures')
require File.expand_path(File.dirname(__FILE__) + '/cpee')
require 'rubygems'
require 'xml/smart'
require 'highline'

module ProcessTransformation

  module Source

    class BPMN2
      attr_reader :dataelements, :endpoints, :start

      def initialize(xml) #{{{
        @graph = Graph.new
        @tree = Tree.new
        @hl = HighLine.new
        @start = nil

        doc = XML::Smart.string(xml)
        doc.register_namespace 'bm',  "http://www.omg.org/spec/BPMN/20100524/MODEL" 

        @dataelements = {}
        doc.find("/bm:definitions/bm:process/bm:property[bm:dataState/@name='cpee:dataelement']").each do |ref|
          if ref.attributes['itemSubjectRef']
            doc.find("/bm:definitions/bm:itemDefinition[@id=\"" + ref.attributes['itemSubjectRef'] + "\"]").each do |sref|
              @dataelements[ref.attributes['name']] = sref.attributes['structureRef'].to_s
            end 
          else
            @dataelements[ref.attributes['name']] = ''
          end  
        end

        @endpoints = {}
        doc.find("/bm:definitions/bm:process/bm:property[bm:dataState/@name='cpee:endpoint']/@itemSubjectRef").each do |ref|
          doc.find("/bm:definitions/bm:itemDefinition[@id=\"" + ref.value + "\"]/@structureRef").each do |sref|
            @endpoints[ref.value] = sref.value
          end  
        end

        # assign all important nodes to nodes
        doc.find("/bm:definitions/bm:process/bm:*[@id and @name and not(@itemSubjectRef) and not(name()='sequenceFlow')]").each do |e|
          n = Node.new(e.attributes['id'],e.qname.name.to_sym,e.attributes['name'].strip,e.find('count(bm:incoming)'),e.find('count(bm:outgoing)'))

          e.find("bm:property[@name='cpee:endpoint']/@itemSubjectRef").each do |ep|
            n.endpoints << ep.value
          end
          e.find("bm:property[@name='cpee:method']/@itemSubjectRef").each do |m|
            n.methods << m.value
          end
          e.find("bm:script").each do |s|
            n.script << s.text.strip
          end
          e.find("bm:ioSpecification/bm:dataInput").each do |a|
            name = a.attributes['name']
            value = a.attributes['itemSubjectRef']
            if @dataelements.keys.include?(value)
              n.parameters[name] = 'data.' + value
            else  
              n.parameters[name] = value
            end
          end
          e.find("bm:ioSpecification/bm:dataOutput").each do |a|
            ref = a.attributes['id']
            e.find("bm:dataOutputAssociation[bm:sourceRef=\"#{ref}\"]").each do |d|
              n.script_var = ref
              n.script_id = d.find("string(bm:targetRef)")
            end
          end

          @graph.add_node n
          @start = n if n.type == :startEvent && @start == nil
        end

        # extract all sequences to a links
        doc.find("/bm:definitions/bm:process/bm:sequenceFlow").each do |e|
          source = e.attributes['sourceRef']
          target = e.attributes['targetRef']
          cond = e.find('bm:conditionExpression')
          @graph.add_link Link.new(source, target, cond.empty? ? nil : cond.first.text.strip)
        end

        @graph.clean_up do |node|
          if node.type == :scriptTask && (x = @graph.find_script_id(node.id))
            x.each do |k,n|
              n.script = node.script
            end
            true
          else
            false
          end  
        end

        @traces = Traces.new [[@start]]
       end #}}}

      def traces #{{{
        build_extraces @traces, @start
        @traces
      end #}}}
      def tree(debug=false) #{{{
        build_ttree @tree, @traces.dup, nil, debug
        @tree
      end #}}}
  
      def build_extraces(traces, node) #{{{
        dupt = traces.last.dup
        @graph.next_nodes(node).each_with_index do |n,i|
          traces << dupt.dup if i > 0
          if traces.last.include?(n)
            traces.last << n
          else  
            traces.last << n
            build_extraces(traces,n)
          end
        end
      end #}}}
      private :build_extraces

      def map_node(node)
        ret = []
        ret << Loop.new(nil, :post_test) if node.incoming > 1
        ret << case node.type
          when :parallelGateway
            Parallel.new(node.id,node.type)
          when :exclusiveGateway
            if node.incoming == 1
              Conditional.new(node.id,:exclusive,node.type)
            else
              ret.last.id = node.id
              ret.last.type = :pre_test
            end
          when :inclusiveGateway
            Conditional.new(node.id,:inclusive,node.type)
          when :endEvent, :startEvent, nil
            nil
          else
            node
        end
        ret.compact
      end

      def build_ttree(branch,traces,enode=nil,debug=false)
        while not traces.finished?
          debug_print debug, traces
          if node = traces.same_first
            map_node(node).each { |n| branch << n }
            traces.shift_all
          else
            tracesgroup, endnode = traces.segment_by(enode) { |n| n.type == branch.last.type }
            tracesgroup.each do |trcs|
              cond = @graph.link(branch.last.id,trcs.first_node.id).condition
              build_ttree branch.last.new_branch(cond), trcs, endnode, debug
              endnode.incoming -= 1
            end
          end
        end
      end

      def debug_print(debug,traces) #{{{
        if debug
          puts '-' * @hl.output_cols, @tree.to_s
          puts traces.to_s
          @hl.ask('Continue ... '){ |q| q.echo = false }
        end  
      end #}}}
      private :debug_print

      def model(formater) #{{{
        formater.new(@tree).generate
      end #}}}

    end  

  end

end  
