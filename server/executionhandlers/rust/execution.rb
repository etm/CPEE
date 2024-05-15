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
      BACKEND_INSTANCE = 'instance.rs'
      BACKEND_OPTS     = 'opts.yaml'
      BACKEND_COMPILE  = File.expand_path(File.join(__dir__,'backend','compile.sh'))
      BACKEND_RUN      = File.expand_path(File.join(__dir__,'backend','run'))

      def self::dslx_to_dsl(dslx) # transpile
        'hello world'
      end

      def self::prepare(id,opts) # write result to disk
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
        File.open(File.join(opts[:instances],id.to_s,ExecutionHandler::Rust::BACKEND_OPTS),'w') do |f|
          YAML::dump({
            :host => opts[:host],
            :url => opts[:url],
            :redis_url => opts[:redis_url],
            :redis_path => File.join(opts[:basepath],opts[:redis_path]),
            :redis_db => opts[:redis_db],
            :workers => opts[:workers],
            :global_executionhandlers => opts[:global_executionhandlers],
            :executionhandlers => opts[:executionhandlers],
            :executionhandler => hw,
            :endpoints => endpoints,
            :dataelements => dataelements,
            :positions => positions,
            :attributes => attributes
          },f)
        end
        File.write(File.join(opts[:instances],id.to_s,ExecutionHandler::Rust::BACKEND_INSTANCE),dsl)
        `#{File.join(opts[:instances],id.to_s,File.basename(ExecutionHandler::Rust::BACKEND_COMPILE))}`
      end

      def self::run(id,opts)
        exe = File.join(opts[:instances],id.to_s,File.basename(ExecutionHandler::Rust::BACKEND_RUN))
        pid = Kernel.spawn(exe , :pgroup => true, :in => '/dev/null', :out => exe + '.out', :err => exe + '.err')
        Process.detach pid
        File.write(exe + '.pid',pid)
      end

      def self::stop(id,opts) ### return: bool to tell if manually changing redis is necessary
        exe = File.join(opts[:instances],id.to_s,File.basename(ExecutionHandler::Rust::BACKEND_RUN))
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
