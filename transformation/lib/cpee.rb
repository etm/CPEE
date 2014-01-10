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

      def print_Node(node,res)
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
        unless node.script.strip == ''
          n.add('manipulate',node.script,'output' => 'result')
        end
      end
      private :print_Node

      def print_Parallel(node,res)
        s1 = res.add('parallel')
        node.sub.each do |branch|
          s2 = s1.add('parallel_branch')
          generate_for_list(branch,s2)
        end
      end
      private :print_Parallel

      def print_Conditional(node,res)
        s1 = res.add('d:choose')
        node.sub.each do |branch|
          s2 = if branch.condition
            s1.add('d:alternative','condition' => branch.condition)
          else
            s1.add('d:otherwise')
          end  
          generate_for_list(branch,s2)
        end
        if (x = s1.find('d:otherwise')).any?
          s1.add x
        end
      end
      private :print_Conditional
    end

  end

end  
