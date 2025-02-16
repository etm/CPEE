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

module CPEE

  module ExecutionHandler

    module Rust
      BACKEND_INSTANCE = File.expand_path(File.join(__dir__,'backend','instance.rs'))
      BACKEND_OPTS     = File.expand_path(File.join(__dir__,'backend','opts.json'))
      BACKEND_CONTEXT  = File.expand_path(File.join(__dir__,'backend','context.json'))
      BACKEND_COMPILE  = File.expand_path(File.join(__dir__,'backend','compile'))
      BACKEND_RUN      = File.expand_path(File.join(__dir__,'backend','run'))
      INDENT = 4

      module Translate #{{{
        def self::_indent(indent) #{{{
          " " * CPEE::ExecutionHandler::Rust::INDENT * indent
        end #}}}

        def self::_nl #{{{
          "\n"
        end #}}}
        def self::_nln #{{{
          ',' + self::_nl
        end #}}}

        def self::f_call(node,indent) #{{{
          x = ''
          x << self::_indent(indent) + 'weel!().call(' + self::_nl
          x << self::_indent(indent+1) + %Q["#{node.find('string(@id)')}"] + self::_nln
          x << self::_indent(indent+1) + %Q["#{node.find('string(@endpoint)')}"] + self::_nln

          # parameters
          x << self::_indent(indent+1) + 'HTTPParams {' + self::_nl
          x << self::_indent(indent+2) + 'label: ' + %Q["#{node.find('string(d:parameters/d:label)')}"] + self::_nln

          if node.find('string(d:parameters/d:method)') == ""
            x << self::_indent(indent+2) + 'method: ' + 'Method::GET' + self::_nln
          else
            x << self::_indent(indent+2) + 'method: ' + 'Method::' + node.find('string(d:parameters/d:method)')[1..-1].upcase + self::_nln
          end

          # arguments
          x << self::_indent(indent+2) + 'arguments: json!([' + self::_nl
          childs = []
          node.find('d:parameters/d:arguments/*').each do |e|
              if e.attributes["rngui-nonfunctional"] == "true"
                next
              end
              childs << self::construct_json_rec(e, indent + 3, "array")
          end
          x << childs.join(self::_nln) + self::_nl
          x << self::_indent(indent+2) + "])" + self::_nln
          # End of HTTP Params
          x << self::_indent(indent+1) + "}" + self::_nln

          # annotations
          x << self::_indent(indent+1) + 'json!({' + self::_nl
          childs = []
          node.find('d:annotations/*').each do |e|
              if e.attributes["rngui-nonfunctional"] == "true"
                next
              end
              childs << self::construct_json_rec(e, indent + 2, "object")
          end
          x << childs.join(self::_nln) + self::_nl
          x << self::_indent(indent+1) + "})" + self::_nln

          %w(prepare update finalize rescue).each do |c|
            if n = node.find('d:code/d:' + c).first
              if n.text == ''
                x << self::_indent(indent+1) + 'None' + self::_nln
              else
                x << self::_indent(indent+1) + 'code! {' + self::_nl
                x << self::_indent(indent+1) + 'r###"' + self::_nl
                x << self::_indent(indent+2) + n.text.gsub(/\n/, "\n#{self::_indent(indent+2)}") + self::_nl
                x << self::_indent(indent+1) + '"###}' + self::_nln
              end
            else
              x << self::_indent(indent+1) + 'None' + self::_nln
            end
          end
          x << self::_indent(indent) + ')?;'
          x + self::_nl
        end #}}}

        # mode defines whether the other structure is an array or an object, for objects, key value pairs are generated, for arrays objects containing name, value fields are generated
        def self::construct_json_rec(node, indent, mode) #{{{
            # Leaf node
            content = "null"
            if node.children.length == 1 && node.text_only?
              content = CPEE::ValueHelper::parse(node.text)
              if content.is_a? String
                content = 'r###"' + content.to_s + '"###'
              else
                content = 'r###"' + content.to_s + '"###'
              end
            elsif node.children.empty? # Leaf node
              # Do nothing
            else # In this case the node itself has children
              content = '{' + self::_nl
              childs = []
              node.children.each do |e|
                # In the depth we always create objects for now (special rules later)
                childs << self::construct_json_rec(e, indent + 1, "object")
              end
              content << childs.join(self::_nln) + self::_nl
              content << self::_indent(indent+2) + '}'
            end
            if mode == "array"
            return self::_indent(indent + 1) + '{' + self::_nl +
              self::_indent(indent+2) + '"name": "' + node.qname.name + '"' + self::_nln +
              self::_indent(indent+2) + '"value": ' + content + self::_nl  +
              self::_indent(indent+1) + '}'
            else # Assume object mode
              return self::_indent(indent+2) + '"' + node.qname.name + '": ' + content
            end
        end #}}}

        def self::f_manipulate(node,indent) #{{{#
          x = ''
          x << self::_indent(indent) +   %Q[weel!().manipulate(] + self::_nl
          x << self::_indent(indent+1) + %Q["#{(node.find('string(@id)'))}"] + self::_nln
          if node.find('string(@label)') == ""
            x << self::_indent(indent+1) + "None" + self::_nln
          else
            x << self::_indent(indent+1) + %Q[Some("#{(node.find('string(@label)'))}")] + self::_nln
          end
          x << self::_indent(indent+1) +  %Q[code! {] + self::_nl
          x << self::_indent(indent+1) +  'r###"' + self::_nl
          x << self::_indent(indent+2) +  node.text + self::_nl
          x << self::_indent(indent+1) +  %Q["###}] + self::_nln
          x << self::_indent(indent) + ")?;" + self::_nl
          x
        end #}}}

        def self::f_parallel(node,indent) #{{{
          x = ''
          x << %Q[weel!().parallel_do(]
          if node.find('string(@wait)').to_i < 0
            x << "None,"
          else
            x << "Some(#{node.find('string(@wait)').to_i}),"
          end
          x << node.find('string(@cancel)').capitalize + ","
          x << 'ƛ!({' + self::_nl
          x
        end #}}}

        def self::f_parallel_branch(node,indent) #{{{
          x = ''
          x <<  self::_indent(indent) + "weel!().parallel_branch(pƛ!({" + self::_nl
          x
        end #}}}

        def self::f_loop(node,indent) #{{{
          x = ''
          x << self::_indent(indent) + %Q[weel!().loop_exec(Weel::] + node.find('string(@mode)')
          x << %Q[("#{node.find('string(@condition)')}"), ƛ!({]  + self::_nl
          x
        end #}}}

        def self::f_choose(node,indent) #{{{
          x = ''
          x <<  self::_indent(indent) + %Q[weel!().choose(#{node.find('string(@mode)').capitalize}, ƛ!({] + self::_nl
          x
        end #}}}

        def self::f_alternative(node,indent) #{{{
          x = ''
          x <<  self::_indent(indent) + %Q[weel!().alternative("#{node.find('string(@condition)')}", ƛ!({] + self::_nl
          x
        end #}}}

        def self::f_otherwise(node,indent) #{{{
          x = ''
          x <<  self::_indent(indent) + %Q[weel!().otherwise(ƛ!({] + self::_nl
          x
        end #}}}

        def self::f_critical(node, indent) #{{{
          x = ''
          x << self::_indent(indent) + %Q[weel!().critical_do("#{node.find('string(@sid)')}", ƛ!({] + self::_nl
        end #}}}


        def self::f_stop(node, indent) #{{{
          x = ''
          x << self::_indent(indent) + %Q[weel!().stop("#{node.find('string(@id)')}")?;] + self::_nl
        end #}}}

        def self::f_terminate(node, indent) #{{{
          x = ''
          x << self_indent(indent) + "weel!().terminate()?;" + self::_nl
        end #}}}

        def self::f_escape(node, indent) #{{{
          x = ''
          x << self_indent(indent) + "weel!().escape()?;" + self::_nl
        end #}}}

        def self::rec(nodes,indent=0) #{{{
          coll = ''
          nodes.each do |node|
            case node.qname.name
              when 'parallel', 'choose', 'otherwise', 'parallel_branch', 'alternative', 'loop', 'critical' then
                # All that have a lambda parameter
                coll << send('f_' + node.qname.name, node, indent)
                coll << rec(node.children, indent+1)
                coll << self::_indent(indent) + "}))?;" + self::_nl
              else
                # call, manipulate, stop, escape
                if node.qname.name !~ /^_/
                  coll << send('f_' + node.qname.name, node, indent)
                end
            end
          end
          coll
        end #}}}
      end #}}}

      def self::dslx_to_dsl(dslx,ep) # transpile {{{
        dslx.register_namespace("d","http://cpee.org/ns/description/1.0")
        Translate::rec dslx.root.children
      end #}}}

      def self::prepare(id,opts) # write result to disk #{{{
        Dir.mkdir(File.join(opts[:instances],id.to_s)) rescue nil

        # Write opts.json
        dsl = CPEE::Persistence::extract_item(id,opts,'dsl')
        hw = CPEE::Persistence::extract_item(id,opts,'executionhandler')
        attributes = CPEE::Persistence::extract_list(id,opts,'attributes').to_h
        iopts = JSON::load_file(ExecutionHandler::Rust::BACKEND_OPTS)
        iopts['instance_id'] = id.to_i
        iopts['host'] = opts[:host]
        iopts['cpee_base_url'] = opts[:url]
        iopts['redis_url'] = opts[:redis_url]
        iopts['redis_path'] = 'unix://' + File.join(opts[:basepath],opts[:redis_path])
        iopts['redis_db'] = opts[:redis_db]
        iopts['workers'] = opts[:workers]
        iopts['global_executionhandlers'] = opts[:global_executionhandlers]
        iopts['executionhandlers'] = opts[:executionhandlers]
        iopts['executionhandler'] = hw
        iopts['attributes'] = attributes
        File.open(File.join(opts[:instances],id.to_s,File::basename(ExecutionHandler::Rust::BACKEND_OPTS)),'w') do |f|
          f.write JSON::pretty_generate(iopts)
        end

        # Write context.json
        endpoints = CPEE::Persistence::extract_list(id,opts,'endpoints').to_h
        dataelements = CPEE::Persistence::extract_list(id,opts,'dataelements').to_h
        data = {}
        dataelements.each do |k, v|
          data[k] = CPEE::ValueHelper::parse(v)
        end
        pos = {}
        positions = CPEE::Persistence::extract_set(id,opts,'positions')
        positions.each do |k, v|
          pos[k] = {"position" => k, "uuid" => "0", "detail" => v, "handler_passthrough" => CPEE::Persistence::extract_item(id,opts,File.join('positions',k,'@passthrough'))}
        end
        p pos
        File.open(File.join(opts[:instances],id.to_s,File::basename(ExecutionHandler::Rust::BACKEND_CONTEXT)),'w') do |f|
          f.write JSON::pretty_generate({
            'endpoints' => endpoints,
            'data' => data,
            'search_positions' => pos
          })
        end
        File.write(File.join(opts[:instances],id.to_s,File.basename(ExecutionHandler::Rust::BACKEND_INSTANCE)),dsl)

        system(ExecutionHandler::Rust::BACKEND_COMPILE, File.join(opts[:instances],id.to_s))
      end #}}}

      def self::run(id,opts) # {{{
        exe = File.join(opts[:instances],id.to_s,File.basename(ExecutionHandler::Rust::BACKEND_RUN))
        pid = Kernel.spawn(exe, id.to_s, :pgroup => true, :in => '/dev/null', :out => exe + '.out', :err => exe + '.err')
        Process.detach pid
        File.write(exe + '.pid',pid)
      end #}}}

      def self::stop(id,opts) ### return: bool to tell if manually changing redis is necessary # {{{
        exe = File.join(opts[:instances],id.to_s,File.basename(ExecutionHandler::Rust::BACKEND_RUN))
        pid = File.read(exe + '.pid') rescue nil
        if pid && (Process.kill(0, pid.to_i) rescue false)
          Process.kill('HUP', pid.to_i) rescue nil
          false
        else # its not running, so clean up
          File.unlink(exe + '.pid') rescue nil
          true
        end
      end # }}}
    end

  end
end
