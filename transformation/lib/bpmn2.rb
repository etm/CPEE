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
          if node.type == :scriptTask && (x = @graph.find_script_id(node.id)).any?
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

      def graph
        @graph
      end

      def traces #{{{
        build_extraces @traces, @start
        #@traces.each do |t|
        #  t.pop if t.uniq.length == t.length
        #end  
        @traces
      end #}}}
      def tree(debug=false) #{{{
        build_ttree @tree, @traces.dup, nil, debug
        debug_print debug, 'Tree finished'
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

      def map_node(node) #{{{
        case node.type
          when :parallelGateway
            Parallel.new(node.id,node.type)
          when :exclusiveGateway
            Conditional.new(node.id,:exclusive,node.type)
          when :eventBasedGateway
            Conditional.new(node.id,:event,node.type)
          when :inclusiveGateway
            Conditional.new(node.id,:inclusive,node.type)
          when :endEvent, :startEvent, nil
            nil
          else
            node
        end
      end #}}}

      def build_ttree(branch,traces,enode=nil,debug=false)
        savetraces = traces.dup
        blindloop = false
        while not traces.finished?
          ### if traces exist more than once, make it so they exist only once
          ### if somebody creates a modell with an inclusive/exclusive that
          ### has identical branches with different conditions, we are fucked
          ### but how are the odds? right? right?
          traces.uniq!
          debug_print debug, traces
          if node = traces.same_first
            if branch.condition?
              li = @graph.link(branch.id,traces.first_node.id)
              branch.condition << li.condition unless li.nil?
            end
            if node == enode
              traces.shift_all
            elsif node.incoming <= 1
              traces.shift_all
              n = map_node(node)
              if !(n.nil? || (n.container? && (node.outgoing <=1 || traces.finished?)))
                (branch << n).compact!
              end
            else
              loops = traces.loops
              if node.type == :exclusiveGateway
                ### as the first is a decision node, just remove and continue
                if node.incoming == 2
                  node.incoming = 1
                  branch << Loop.new(node.id)
                  ### remove the gateway itself, as for a single loop it is no longer used.
                  ### the condition will the loop condition
                  traces.shift_all
                  build_ttree branch.last, loops, nil, debug
                else  
                  ### dont remove it, treat it as a normal conditional
                  ### an infinite loop that can only be left by break is created
                  node.incoming = 1
                  branch << BlindLoop.new(node.id)
                  ### add the blank conditional to get a break
                  len = loops.length
                  loops << [loops.first_node]
                  build_ttree branch.last, loops, nil, debug
                  ### set outgoing to number of loops (without the break) so that it can be ignored (should be 1 all the time)
                  p #{loops.length}
                  node.outgoing -= len
                end   
              else
                branch << BlindLoop.new(node.id)
                node.incoming -= loops.length
                ### throw away the loop traces, remove loop traces from front of all other traces
                traces.segment_by_loops loops
                build_ttree branch.last, loops, nil, debug
              end
              traces.remove(loops)
            end
          else
            endnode = traces.find_endnode || enode
            tracesgroup, endnode = traces.segment_by endnode
            tracesgroup.each do |trcs|
              if trcs.finished?
                build_ttree branch.last.new_branch, Traces.new([[Break.new(1)]]), endnode, debug
              else  
                build_ttree branch.last.new_branch, trcs, endnode, debug
              end  
              endnode.incoming -= 1 unless endnode.nil?
            end
            ### all before is reduced to one incoming arrow
            ### if now there is still more than one incoming we have a loop situation
            ### where the end of a branching statement is also the starting/endpoint 
            ### of a loop
            endnode.incoming += 1 unless endnode.nil?
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
