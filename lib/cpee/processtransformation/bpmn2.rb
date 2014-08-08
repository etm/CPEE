# encoding: UTF-8
#
# This file is part of CPEE.
#
# Apache License, Version 2.0
# 
# Copyright (c) 2013 Juergen Mangler
# 
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
#     http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

require File.expand_path(File.dirname(__FILE__) + '/structures')
require 'rubygems'
require 'xml/smart'
require 'highline'

module CPEE

  module ProcessTransformation

    module Source

      class BPMN2
        attr_reader :dataelements, :endpoints, :start, :graph

         def initialize(xml) #{{{
          @tree = Tree.new
          @hl = HighLine.new
          @start = nil

          doc = XML::Smart.string(xml)
          doc.register_namespace 'bm',  "http://www.omg.org/spec/BPMN/20100524/MODEL" 

          @dataelements = {}
          @endpoints = {}
          @graph = Graph.new

          extract_dataelements(doc)
          extract_endpoints(doc)
          extract_nodelink(doc)

          @traces = Traces.new [[@start]]
        end #}}}

        def extract_dataelements(doc)
          doc.find("/bm:definitions/bm:process/bm:property[bm:dataState/@name='cpee:dataelement']").each do |ref|
            if ref.attributes['itemSubjectRef']
              doc.find("/bm:definitions/bm:itemDefinition[@id=\"" + ref.attributes['itemSubjectRef'] + "\"]").each do |sref|
                @dataelements[ref.attributes['name']] = sref.attributes['structureRef'].to_s
              end 
            else
              @dataelements[ref.attributes['name']] = ''
            end  
          end
        end

        def extract_endpoints(doc)
          doc.find("/bm:definitions/bm:process/bm:property[bm:dataState/@name='cpee:endpoint']/@itemSubjectRef").each do |ref|
            doc.find("/bm:definitions/bm:itemDefinition[@id=\"" + ref.value + "\"]/@structureRef").each do |sref|
              @endpoints[ref.value] = sref.value
            end  
          end
        end

        def extract_nodelink(doc)
          doc.find("/bm:definitions/bm:process/bm:*[@id and @name and not(@itemSubjectRef) and not(name()='sequenceFlow')]").each do |e|
            n = Node.new(e.attributes['id'],e.qname.name.to_sym,e.attributes['name'].strip,e.find('count(bm:incoming)'),e.find('count(bm:outgoing)'))

            if e.attributes['scriptFormat'] != ''
              n.script_type = e.attributes['scriptFormat']
            end

            e.find("bm:property[@name='cpee:endpoint']/@itemSubjectRef").each do |ep|
              n.endpoints << ep.value
            end
            e.find("bm:property[@name='cpee:method']/@itemSubjectRef").each do |m|
              n.methods << m.value
            end
            e.find("bm:script").each do |s|
              n.script ||= ''
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
                n.script_type = node.script_type
              end
              true
            else
              false
            end  
          end
        end

        def build_traces #{{{
          build_extraces @traces, @start
          @traces
        end #}}}
        def build_tree(debug=false) #{{{
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
              Parallel.new(node.id,node.type,1)
            when :inclusiveGateway
              Conditional.new(node.id,:inclusive,node.type)
            when :endEvent, :startEvent, nil
              nil
            else
              node
          end
        end #}}}
        private :map_node

        def build_ttree(branch,traces,enode=nil,debug=false,down=0)
          while not traces.finished?
            ### if traces exist more than once, make it so they exist only once
            ### if somebody creates a modell with an inclusive/exclusive that
            ### has identical branches with different conditions, we are fucked
            ### but how are the odds? right? right?
            traces.uniq!
            puts '--> now on ' + down.to_s if debug
            debug_print debug, traces
            if node = traces.same_first
              if branch.condition? && branch.empty?
                li = @graph.link(branch.id,traces.first_node.id)
                unless li.nil?
                  branch.condition << li.condition unless li.condition.nil?
                  branch.condition_type = "text/javascript"
                end  
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
                if node.type == :exclusiveGateway || traces.all_loops?
                  ### as the first is a decision node, just remove and continue
                  if node.incoming == 2
                    node.incoming = 1
                    branch << Loop.new(node.id)
                    ### remove the gateway itself, as for a single loop it is no longer used.
                    ### the condition will the loop condition
                    if traces.all_loops?
                      loops.pop_all
                    else
                      traces.shift_all
                    end
                    puts '--> down to ' + (down + 1).to_s if debug
                    loops.remove_empty
                    puts '--> up from ' + down.to_s if debug
                    build_ttree branch.last, loops.dup, nil, debug, down + 1
                  else  
                    ### dont remove it, treat it as a normal conditional
                    ### an infinite loop that can only be left by break is created
                    node.incoming = 1
                    branch << InfiniteLoop.new(node.id)
                    ### add the blank conditional to get a break
                    len = loops.length
                    loops.add_breaks
                    puts '--> down to ' + (down + 1).to_s if debug
                    build_ttree branch.last, loops.dup, nil, debug, down + 1
                    puts '--> up from ' + down.to_s if debug
                    ### set outgoing to number of loops (without the break) so that it can be ignored (should be 1 all the time)
                    node.outgoing -= len
                  end   
                else
                  node.incoming -= loops.length
                  ### throw away the loop traces, remove loop traces from front of all other traces
                  traces.segment_by_loops loops
                  puts '--> down to ' + (down + 1).to_s if debug
                  build_ttree branch, loops.dup, nil, debug, down + 1
                  puts '--> up from ' + down.to_s if debug
                end
                traces.remove(loops)
                traces.remove_empty
              end
            else
              endnode = traces.find_endnode || enode
              tracesgroup, endnode = traces.segment_by endnode
              tracesgroup.each do |trcs|
                nb = branch.last.new_branch
                if trcs.finished?
                  puts '--> down to ' + (down + 1).to_s if debug
                  build_ttree nb, Traces.new([[Break.new(1)]]), endnode, debug, down + 1
                  puts '--> up from ' + down.to_s if debug
                else  
                  puts '--> down to ' + (down + 1).to_s if debug
                  build_ttree nb, trcs, endnode, debug, down + 1
                  puts '--> up from ' + down.to_s if debug
                end  
                endnode.incoming -= 1 unless endnode.nil?
              end
              traces.empty! if endnode.nil?
              ### all before is reduced to one incoming arrow
              ### if now there is still more than one incoming we have a loop situation
              ### where the end of a branching statement is also the starting/endpoint 
              ### of a loop
              endnode.incoming += 1 unless endnode.nil?
            end
          end
        end
        private :build_ttree

        def debug_print(debug,traces) #{{{
          if debug
            puts '-' * @hl.output_cols, @tree.to_s
            puts traces.to_s
            @hl.ask('Continue ... '){ |q| q.echo = false }
          end  
        end #}}}
        private :debug_print

        def generate_model(formater) #{{{
          formater.new(@tree).generate
        end #}}}

      end  

    end

  end

end
