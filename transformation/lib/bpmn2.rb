require File.expand_path(File.dirname(__FILE__) + '/structures')
require File.expand_path(File.dirname(__FILE__) + '/cpee')
require 'rubygems'
require 'xml/smart'

module ProcessTransformation

  module Source

    class BPMN2
      attr_reader :dataelements, :endpoints, :start

      def initialize(xml) #{{{
        @graph = Graph.new
        @tree = Tree.new
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
          @graph.add_flow Link.new(source, target, cond.empty? ? nil : cond.first.text.strip)
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
        build_ttree @tree, @traces.dup, debug
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
            Parallel.new(node.id)
          when :exclusiveGateway
            if node.incoming == 1
              Conditional.new(node.id,:exclusive)
            else
              ret.last.id = node.id
              ret.last.type = :pre_test
            end
          when :inclusiveGateway
            Conditional.new(node.id,:inclusive)
          when :endEvent, :startEvent
            nil
          else
            node
        end
        ret.compact
      end

      def build_ttree(branch,traces,debug=false)
        while not traces.finished?
          group = traces.group_by_first
          if group.length == 1
            map_node(group.first.first_node).each do |n|
              branch << n
            end  
            traces.shift
          else
            group.each do |trcs|
              build_ttree branch.last.new_branch, trcs, debug
            end
          end
          if debug
            puts traces.to_s
            puts @tree.to_s
            STDIN.getc
          end  
        end
      end

      def build_tree(branch,node) #{{{
        while node
          if node.incoming > 1 # Loop ?
          end  
          case node.type
            when :parallelGateway
              return node if node.incoming > 1 
              if node.incoming == 1 && node.outgoing > 1
                branch << (x = Parallel.new(node.id))
                ncollect = @graph.next_nodes(node).map do |n|
                  build_tree(x.new_branch,n)
                end.flatten
                if ncollect.uniq.length == 1
                  ### e.g. multiple nested parallels share one parallel end node, i.e. not wellformed (see test/base4.xml)
                  if ncollect.length < ncollect.first.incoming 
                    return ncollect
                  ### a wellformed (start and end) structure   
                  else
                    node = ncollect.first
                  end  
                else  
                  ### shit hits the fan, some syntax error in modelling
                  raise "#{x.pretty_inspect}-----> no common end node"
                end  
              end
            when :exclusiveGateway
              # check if a branch is part of a loop -> branch and condition is a loop (also works for multiple)
              # if more than one branch reaches end its an exclusive
              # if one branch reaches the end continue as normal
              return node if node.incoming > 1 
              if node.incoming == 1 && node.outgoing > 1
                branch << (x = Conditional.new(node.id,:exclusive))
                ncollect = @graph.next_nodes(node).map do |n|
                  cond = @graph.incoming_condition(n).first.condition
                  build_tree(x.new_branch(cond),n)
                end.flatten
                if ncollect.uniq.length == 1
                  ### e.g. multiple nested parallels share one parallel end node, i.e. not wellformed (see test/base4.xml)
                  if ncollect.length < ncollect.first.incoming 
                    return ncollect
                  ### a wellformed (start and end) structure   
                  else
                    node = ncollect.first
                  end  
                else  
                  ### shit hits the fan, some syntax error in modelling
                  raise "#{x.pretty_inspect}-----> no common end node"
                end  
              end
            when :task, :callActivity, :serviceTask
              branch << node
            when :endEvent
              node = nil
            when :scriptTask
              puts 'nooooow'
            when :startEvent
            else
              raise "#{node.type} not supported yet"
          end

          node = @graph.next_node(node) if node
        end

      end #}}}
      private :build_tree

      def model(formater) #{{{
        formater.new(@tree).generate
      end #}}}

    end  

  end

end  
