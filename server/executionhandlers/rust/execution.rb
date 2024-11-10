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
          x << self::_indent(indent+2) + 'arguments: Some(vec![' + self::_nl
          node.find('d:parameters/d:arguments/*').each do |e|
            if e.text[0] == '!'
              x << self::_indent(indent+3) + 'new_key_value_pair_ex("' + e.qname.name + '", "' + e.text[1..-1] + '")' + self::_nln
            else
              x << self::_indent(indent+3) + 'new_key_value_pair("' + e.qname.name + '", "' + e.text + '")' + self::_nln
            end
          end
          x << self::_indent(indent+2) + '])' + self::_nln
          x << self::_indent(indent+1) + "}" + self::_nln

          %w(prepare finalize update rescue).each do |c|
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

        def self::f_manipulate(node,indent) #{{{
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
          x << self::_indent(indent) + ")?;" + self::_nl
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

      def self::dslx_to_dsl(dslx) # transpile {{{
        dslx.register_namespace("d","http://cpee.org/ns/description/1.0")
        p dslx.namespaces
        Translate::rec dslx.root.children
      end #}}}

      def self::prepare(id,opts) # write result to disk #{{{
        Dir.mkdir(File.join(opts[:instances],id.to_s)) rescue nil
        FileUtils.copy(ExecutionHandler::Rust::BACKEND_COMPILE,File.join(opts[:instances],id.to_s))
        dsl = CPEE::Persistence::extract_item(id,opts,'dsl')
        hw = CPEE::Persistence::extract_item(id,opts,'executionhandler')
        endpoints = CPEE::Persistence::extract_list(id,opts,'endpoints').to_h
        dataelements = CPEE::Persistence::extract_list(id,opts,'dataelements').to_h
        attributes = CPEE::Persistence::extract_list(id,opts,'attributes').to_h
        positions = CPEE::Persistence::extract_set(id,opts,'positions')
        positions.map! do |k, v|
          [ k, v, CPEE::Persistence::extract_item(id,opts,File.join('positions',k,'@passthrough')) ]
        end
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
        File.open(File.join(opts[:instances],id.to_s,File::basename(ExecutionHandler::Rust::BACKEND_CONTEXT)),'w') do |f|
          f.write JSON::pretty_generate({
            'endpoints' => endpoints,
            'dataelements' => dataelements,
            'positions' => positions
          })
        end
        File.write(File.join(opts[:instances],id.to_s,File.basename(ExecutionHandler::Rust::BACKEND_INSTANCE)),dsl)
        `#{File.join(opts[:instances],id.to_s,File.basename(ExecutionHandler::Rust::BACKEND_COMPILE))}`
      end #}}}

      def self::run(id,opts) # {{{
        exe = File.join(opts[:instances],id.to_s,File.basename(ExecutionHandler::Rust::BACKEND_RUN))
        pid = Kernel.spawn(exe , :pgroup => true, :in => '/dev/null', :out => exe + '.out', :err => exe + '.err')
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
