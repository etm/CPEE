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

    module Ruby
      BACKEND_INSTANCE = 'instance.rb'
      BACKEND_OPTS     = 'opts.yaml'
      DSL_TO_DSLX_XSL  = File.expand_path(File.join(__dir__,'dsl_to_dslx.xsl'))
      BACKEND_RUN      = File.expand_path(File.join(__dir__,'backend','run'))
      BACKEND_TEMPLATE = File.expand_path(File.join(__dir__,'backend','instance.template'))

      def self::dslx_to_dsl(dslx) # transpile
        trans = XML::Smart::open_unprotected(ExecutionHandler::Ruby::DSL_TO_DSLX_XSL)
        dslx.transform_with(trans).to_s
      end

      def self::prepare(id,opts) # write result to disk
        Dir.mkdir(File.join(opts[:instances],id.to_s)) rescue nil
        FileUtils.copy(ExecutionHandler::Ruby::BACKEND_RUN,File.join(opts[:instances],id.to_s))
        dsl = CPEE::Persistence::extract_item(id,opts,'dsl')
        hw = CPEE::Persistence::extract_item(id,opts,'executionhandler')
        endpoints = CPEE::Persistence::extract_list(id,opts,'endpoints')
        dataelements = CPEE::Persistence::extract_list(id,opts,'dataelements')
        positions = CPEE::Persistence::extract_set(id,opts,'positions')
        positions.map! do |k, v|
          [ k, v, CPEE::Persistence::extract_item(id,opts,File.join('positions',k,'@passthrough')) ]
        end
        File.open(File.join(opts[:instances],id.to_s,ExecutionHandler::Ruby::BACKEND_OPTS),'w') do |f|
          YAML::dump({
            :host => opts[:host],
            :url => opts[:url],
            :redis_url => opts[:redis_url],
            :redis_path => File.join(opts[:basepath],opts[:redis_path]),
            :redis_db => opts[:redis_db],
            :workers => opts[:workers],
            :global_executionhandlers => opts[:global_executionhandlers],
            :executionhandlers => opts[:executionhandlers],
            :executionhandler => hw
          },f)
        end
        template = ERB.new(File.read(ExecutionHandler::Ruby::BACKEND_TEMPLATE), trim_mode: '-')
        res = template.result_with_hash(dsl: dsl, dataelements: dataelements, endpoints: endpoints, positions: positions)
        File.write(File.join(opts[:instances],id.to_s,ExecutionHandler::Ruby::BACKEND_INSTANCE),res)
      end

      def self::run(id,opts)
        exe = File.join(opts[:instances],id.to_s,File.basename(ExecutionHandler::Ruby::BACKEND_RUN))
        pid = Kernel.spawn(exe , :pgroup => true, :in => '/dev/null', :out => exe + '.out', :err => exe + '.err')
        Process.detach pid
        File.write(exe + '.pid',pid)
      end

      def self::stop(id,opts) ### return: bool to tell if manually changing redis is necessary
        exe = File.join(opts[:instances],id.to_s,File.basename(ExecutionHandler::Ruby::BACKEND_RUN))
        pid = File.read(exe + '.pid') rescue nil
        if pid && (Process.kill(0, pid.to_i) rescue false)
          Process.kill('HUP', pid.to_i) rescue nil
          false
        else # its not running, so clean up
          File.unlink(exe + '.pid') rescue nil
          true
        end
      end
    end

  end

end
