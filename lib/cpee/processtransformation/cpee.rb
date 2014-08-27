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

module CPEE

  module ProcessTransformation

    module Target

      class CPEE
        def initialize(tree)
          @tree = tree
        end
        def generate
          res = XML::Smart.string("<description xmlns='http://cpee.org/ns/description/1.0'/>")
          res.register_namespace 'd', 'http://cpee.org/ns/description/1.0'
          generate_for_list(@tree,res.root)
          res
        end

        def generate_for_list(list,res)
          list.each do |e|
            nam = e.class.name.gsub(/\w+:+/,'')
            send("print_#{nam}".to_sym,e,res)
          end
        end
        private :generate_for_list

        def print_Break(node,res)
          res.add('break')
        end

        def print_InfiniteLoop(node,res)
          s1 = res.add('loop', 'pre_test' => 'true')
          node.attributes.each do |k,v|
            s1.attributes[k] = v
          end
          generate_for_list(node,s1)
        end
        def print_Loop_default(node,res)
          s1 = res.add('loop', 'pre_test' => node.condition.empty? ? 'true' : node.condition.join(' && '))
          s1.attributes['language'] = node.condition_type unless node.condition_type.nil?
          node.attributes.each do |k,v|
            s1.attributes[k] = v
          end
          generate_for_list(node,s1)
          s1
        end
        private :print_Loop_default
        def print_Loop(node,res); print_Loop_default(node,res); end
        private :print_Loop

        def print_Node(node,res)
          if node.endpoints.empty? && !node.script.nil? && node.script.strip != ''
            n = res.add('d:manipulate', 'id' => "a#{node.niceid}")
            n.text = node.script
            n.attributes['output'] = node.script_var unless node.script_var.nil?
            n.attributes['language'] = node.script_type unless node.script_type.nil?
          else
            n   = res.add('d:call', 'id' => "a#{node.niceid}", 'endpoint' => node.endpoints.join(','))
            p   = n.add('d:parameters')
                  p.add('d:label',node.label)
                  p.add('d:method',node.methods.join(','))
                  p.add('d:type',node.type)
                  p.add('d:mid',node.id)
            par = p.add('d:parameters')
            node.parameters.each do |k,v|
              par.add(k,v)
            end
            if !node.script.nil? && node.script.strip != ''
              x = n.add('manipulate',node.script)
              x.attributes['output'] = node.script_var unless node.script_var.nil?
              x.attributes['language'] = node.script_type unless node.script_type.nil?
            end
          end
        end
        private :print_Node

        def print_Parallel_default(node,res)
          s1 = res.add('parallel','wait' => node.wait)
          node.sub.each do |branch|
            s2 = s1.add('parallel_branch')
            generate_for_list(branch,s2)
          end
          s1
        end
        private :print_Parallel_default
        def print_Parallel(node,res); print_Parallel_default(node,res); end
        private :print_Parallel

        def print_Conditional_default(node,res)
          s1 = res.add('d:choose', 'mode' => node.mode)
          node.sub.each do |branch|
            s2 = if branch.condition.any?
              a = s1.add('d:alternative','condition' => branch.condition.join(' or '))
              a.attributes['language'] = branch.condition_type unless branch.condition_type.nil?
              a
            else
              s1.add('d:otherwise')
            end
            branch.attributes.each do |k,v|
              s2.attributes[k] = v
            end
            generate_for_list(branch,s2)
          end
          if (x = s1.find('d:otherwise')).any?
            s1.add x
          end
          s1
        end
        private :print_Conditional_default
        def print_Conditional(node,res); print_Conditional_default(node,res); end
        private :print_Conditional

      end

    end

  end

end
