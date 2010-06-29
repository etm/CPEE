require 'thread'

# OMG!111! strings have to be emptied
class String# {{{
  def clear
      self.slice!(0..-1)
  end
end# }}}

class Wee
  module Signal
    class SkipManipulate < Exception; end
    class StopSkipManipulate < Exception; end
    class Proceed < Exception; end
  end  

  class ManipulateRealization# {{{
    def initialize(context,endpoints)
      @__wee_context = context
      @__wee_endpoints = endpoints
      @changed_context = []
      @changed_endpoints = []
    end

    attr_reader :changed_context, :changed_endpoints

    def context
      ManipulateHash.new(@__wee_context,@changed_context)
    end
    def endpoints
      ManipulateHash.new(@__wee_endpoints,@changed_endpoints)
    end
  end# }}}
  class ManipulateHash# {{{
    def initialize(values,what)
      @__wee_values = values
      @__wee_what = what
    end

    def delete(value)
      if @__wee_values.has_key?(value)
        @__wee_what << value
        @__wee_values.delete(value)
      end  
    end

    def clear
      @__wee_what += @__wee_values.keys
      @__wee_values.clear
    end

    def method_missing(name,*args)
      if args.empty? && @__wee_values.has_key?(name)
        @__wee_values[name] 
        #TODO mark dirty
      elsif name.to_s[-1..-1] == "="
        temp = name.to_s[0..-2]
        @__wee_what << temp.to_sym
        @__wee_values[temp.to_sym] = args[0]
      else
        super
      end
    end
  end# }}}
  class ReadHash# {{{
    def initialize(values)
      @__wee_values = values
    end

    def method_missing(name,*args)
      temp = nil
      if args.empty? && @__wee_values.has_key?(name)
        @__wee_values[name] 
        #TODO dont let user change stuff
      else
        super
      end
    end
  end# }}}

  class Position# {{{
    attr_reader :position
    attr_accessor :detail, :passthrough
    def initialize(position, detail=:at, passthrough=nil) # :at or :after
      @position = position
      @detail = detail
      @passthrough = passthrough
    end
  end# }}}
  class HandlerWrapperBase# {{{
    def initialize(args,position=nil,lay=nil,continue=nil); end

    def activity_handle(passthrough, endpoint, parameters); end
    def activity_result_value; end

    def activity_stop; end
    def activity_passthrough_value; end

    def activity_no_longer_necessary; end

    def inform_activity_done; end
    def inform_activity_manipulate; end
    def inform_activity_failed(err); end

    def inform_syntax_error(err); end
    def inform_context_change(changed); end
    def inform_endpoints_change(changed); end
    def inform_position_change; end
    def inform_state_change(newstate); end
    
    def vote_sync_before; end
    def vote_sync_after; end
  end  # }}}
  class Continue# {{{
    def initialize
      @thread = Thread.new{Thread.stop}
    end  
    def waiting?
      @thread.alive?
    end  
    def continue
      @thread.wakeup if @thread.alive?
    end
    def wait
      @thread.join
    end
  end  # }}}

  def initialize(*args)# {{{
    @__wee_search_positions = {}
    @__wee_positions = Array.new
    @__wee_main = nil
    @__wee_main_mutex = Mutex.new
    @__wee_context ||= Hash.new
    @__wee_endpoints ||= Hash.new
      
    initialize_search if methods.include?('initialize_search')
    initialize_context if methods.include?('initialize_context')
    initialize_endpoints if methods.include?('initialize_endpoints')
    initialize_handlerwrapper if methods.include?('initialize_handlerwrapper')
    
    @__wee_handlerwrapper_args = args
    @__wee_state = :ready
  end# }}}

  def self::search(wee_search)# {{{
    define_method :initialize_search do 
      self.search wee_search
    end
  end# }}}

  def self::endpoint(new_endpoints)# {{{
    @@__wee_new_endpoints ||= {}
    @@__wee_new_endpoints.merge! endpoints
    define_method :initialize_endpoints do
      @@__wee_new_endpoints.each do |name,value|
        @__wee_endpoints[name.to_s.to_sym] = value
      end
    end
  end# }}}

  def self::context(variables)# {{{
    @@__wee_new_context_variables ||= {}
    @@__wee_new_context_variables.merge! endpoints
    define_method :initialize_context do
      @@__wee_new_context_variables.each do |name,value|
        @__wee_context[name.to_s.to_sym] = value
      end
    end
  end# }}}

  def self::handlerwrapper(aClassname, *args)# {{{
    define_method :initialize_handlerwrapper do 
      self.handlerwrapper = aClassname
      self.handlerwrapper_args = args
    end
  end# }}}

  def self::control(flow, &block)# {{{
    @@__wee_control_block = block
    define_method :__wee_control_flow do
      self.state = :running
      instance_eval(&(@@__wee_control_block))
      self.state = :finished if self.state == :running
    end
  end# }}}

  def self::flow; end

  protected
    # DSL-Construct for an atomic activity
    # position: a unique identifier within the wf-description (may be used by the search to identify a starting point
    # type:
    #   - :manipulate - just yield a given block
    #   - :call - order the handlerwrapper to perform a service call
    # endpoint: (only with :call) ep of the service
    # parameters: (only with :call) service parameters
    def activity(position, type, endpoint=nil, *parameters, &blk)# {{{
      position, lay = position_test position
      sm = is_in_search_mode(position)
      return if self.state == :stopping || self.state == :stopped || Thread.current[:nolongernecessary] || sm

      Thread.current[:continue] = Continue.new
      begin
        handlerwrapper = @__wee_handlerwrapper.new @__wee_handlerwrapper_args, @__wee_endpoints[endpoint], position, lay, Thread.current[:continue]

        wp = Wee::Position.new(position, :at, nil)
        @__wee_positions << wp

        handlerwrapper.vote_sync_before
        case type
          when :manipulate
            if block_given?
              handlerwrapper.inform_activity_manipulate
              mr = ManipulateRealization.new(@__wee_context,@__wee_endpoints)
              mr.instance_exec(*parameters,&blk)
              handlerwrapper.inform_context_change(mr.changed_context.uniq) if mr.changed_context.any?
              handlerwrapper.inform_endpoints_change(mr.changed_endpoints.uniq) if mr.changed_endpoints.any?
            end  
          when :call
            passthrough = @__wee_search_positions[position] ? @__wee_search_positions[position].passthrough : nil
            ret_value = perform_external_call wp, passthrough, handlerwrapper, *parameters
            if block_given? && self.state != :stopping && !Thread.current[:nolongernecessary]
              handlerwrapper.inform_activity_manipulate
              mr = ManipulateRealization.new(@__wee_context,@__wee_endpoints)
              mr.instance_exec(ret_value,&blk)
              handlerwrapper.inform_context_change(mr.changed_context.uniq) if mr.changed_context.any?
              handlerwrapper.inform_endpoints_change(mr.changed_endpoints.uniq) if mr.changed_endpoints.any?
            end
        end
        raise Signal::Proceed
      rescue Signal::SkipManipulate, Signal::Proceed
        if self.state != :stopping && !Thread.current[:nolongernecessary]
          handlerwrapper.inform_activity_done
          handlerwrapper.vote_sync_after
        end
        if self.state != :stopping
          @__wee_positions.delete wp
          handlerwrapper.inform_position_change
        end
      rescue Signal::StopSkipManipulate
        self.state = :stopping
      rescue => err
        puts err.message
        puts err.backtrace
        handlerwrapper.inform_activity_failed err
        self.state = :stopping
      end
    end# }}}
    
    # Parallel DSL-Construct
    # Defines Workflow paths that can be executed parallel.
    # May contain multiple branches (parallel_branch)
    def parallel(type=nil)# {{{
      return if self.state == :stopping || self.state == :stopped || Thread.current[:nolongernecessary]

      Thread.current[:branches] = []
      Thread.current[:branch_event] = Thread.new{Thread.stop}
      Thread.current[:mutex] = Mutex.new
      yield

      wait_count = (type.is_a?(Hash) && type.size == 1 && type[:wait] != nil && (type[:wait].is_a?(Integer)) ? type[:wait] : Thread.current[:branches].size)
      finished_threads_count = 0

      branch_count = true
      while branch_count
        finished_threads_count = 0
        Thread.current[:branches].each do |thread| 
          finished_threads_count += 1 if thread[:branch_status] == true
        end  
        if finished_threads_count < wait_count && finished_threads_count < Thread.current[:branches].size && self.state != :stopping
          Thread.current[:branch_event].join
        else  
          branch_count = false
        end
      end
      Thread.current[:branch_run] = true if Thread.current[:branch_search] == false

      unless self.state == :stopping || self.state == :stopped
        Thread.current[:branches].each do |thread| 
          if thread.alive? 
            thread[:nolongernecessary] = true
            recursive_continue(thread)
          end  
        end
      end  
    end# }}}

    # Defines a branch of a parallel-Construct
    def parallel_branch(*vars)# {{{
      return if self.state == :stopping || self.state == :stopped || Thread.current[:nolongernecessary]
      branch_parent = Thread.current
      Thread.current[:branches] << Thread.new(*vars) do |*local|
        Thread.current.abort_on_exception = true
        if branch_parent.key?(:branch_run)
          Thread.current[:branch_search] = false
          Thread.current[:branch_run] = true
        end  
        Thread.current[:branch_status] = false
        Thread.current[:branch_parent] = branch_parent
        if branch_parent[:alternative_executed] && branch_parent[:alternative_executed].length > 0
          Thread.current[:alternative_executed] = [branch_parent[:alternative_executed].last]
        end
        yield(*local)
        Thread.current[:branch_status] = true
        branch_parent[:mutex].synchronize do # enable the while in parallel() to operate without polling
          pte = branch_parent[:branch_event]
          branch_parent[:branch_event] = Thread.new{Thread.stop}
          pte.run
        end
      end
    end# }}}

    # Choose DSL-Construct
    # Defines a choice in the Workflow path.
    # May contain multiple execution alternatives
    def choose# {{{
      return if self.state == :stopping || self.state == :stopped || Thread.current[:nolongernecessary]
      Thread.current[:alternative_executed] ||= []
      Thread.current[:alternative_executed] << false
      yield
      Thread.current[:alternative_executed].pop
      nil
    end# }}}

    # Defines a possible choice of a choose-Construct
    # Block is executed if condition == true or
    # searchmode is active (to find the starting position)
    def alternative(condition)# {{{
      return if self.state == :stopping || self.state == :stopped || Thread.current[:nolongernecessary]
      yield if is_in_search_mode || condition
      Thread.current[:alternative_executed][-1] = true if condition
    end# }}}
    def otherwise# {{{
      return if self.state == :stopping || self.state == :stopped || Thread.current[:nolongernecessary]
      yield if is_in_search_mode || !Thread.current[:alternative_executed].last
    end# }}}

    # Defines a critical block (=Mutex)
    def critical(id)# {{{
      @__wee_critical ||= Mutex.new
      semaphore = nil
      @__wee_critical.synchronize do
        @__wee_critical_sections ||= {}
        semaphore = @__wee_critical_sections[id] ? @__wee_critical_sections[id] : Mutex.new
        @__wee_critical_sections[id] = semaphore if id
      end
      semaphore.synchronize do
        yield
      end
    end# }}}

    # Defines a Cycle (loop/iteration)
    def loop(condition)# {{{
      unless condition.is_a?(Array) && condition[0].is_a?(Proc) && [:pre_test,:post_test].include?(condition[1])
        raise "condition must be called pre_test{} or post_test{}"
      end
      return if self.state == :stopping || self.state == :stopped || Thread.current[:nolongernecessary]
      yield if is_in_search_mode
      return if is_in_search_mode
      case condition[1]
        when :pre_test
          yield while condition[0].call && self.state != :stopping
        when :post_test
          begin; yield; end while condition[0].call && self.state != :stopping
      end
    end# }}}

    def pre_test(&blk)# {{{
      [blk, :pre_test]
    end# }}}
    def post_test(&blk)# {{{
      [blk, :post_test]
    end# }}}

  private
    def recursive_continue(thread)# {{{
      if thread && thread.alive? && thread[:continue] && thread[:continue].waiting?
        thread[:continue].continue
      end
      if thread[:branches]
        thread[:branches].each do |b|
          recursive_continue(b)
        end
      end  
    end  # }}}
    def recursive_join(thread)# {{{
      if thread && thread.alive? && thread != Thread.current
        thread.join
      end
      if thread[:branches]
        thread[:branches].each do |b|
          recursive_join(b)
        end
      end  
    end  # }}}

    def position_test(position)# {{{
      pos = false
      if position.is_a?(Symbol) && position.to_s =~ /[a-zA-Z][a-zA-Z0-9_]*/
        pos = true
        lay = nil
      end   
      if position.is_a?(Array) && position.length != 0 && position[0].is_a?(Symbol) && position[0].to_s =~ /[a-zA-Z][a-zA-Z0-9_]*/
        pos = true
        lay = position[1..-1]
        position = position[0]
      end  
      if pos
        [position, lay]
      else   
        self.state = :stopping
        handlerwrapper = @__wee_handlerwrapper.new @__wee_handlerwrapper_args
        handlerwrapper.inform_syntax_error(Exception.new("position (#{position}) and lay (#{lay.inspect}) not valid"))
      end
    end# }}}

    def is_in_search_mode(position = nil)# {{{
      branch = Thread.current
      return false if @__wee_search_positions.empty? || branch[:branch_search] == false

      if position && @__wee_search_positions.include?(position) # matching searchpos => start execution from here
        branch[:branch_search] = false # execute all activities in THIS branch (thread) after this point
        branch[:branch_run] = true # new threads (branches) spawned by this branch (thread) should inherit that we no longer want to search
        while branch.key?(:branch_parent) # also all parent branches should execute activities after this point, additional branches spawned by parent branches should still be in search mode
          branch = branch[:branch_parent]
          branch[:branch_search] = false
        end
        @__wee_search_positions[position].detail == :after
      else  
        branch[:branch_search] = true
      end  
    end# }}}
    def perform_external_call(wp, passthrough, handlerwrapper, *parameters)# {{{
      params = { }
      parameters.each do |p|
        if p.class == Hash && parameters.length == 1
          params = p
        else  
          if !p.is_a?(Symbol) || !@__wee_context.include?(p)
            raise("not all passed parameters are context variables")
          end
          params[p] = @__wee_context[p]
        end
      end
      # handshake call and wait until it finished
      handlerwrapper.activity_handle passthrough, params
      Thread.current[:continue].wait unless Thread.current[:nolongernecessary] || self.state == :stopping || self.state == :stopped
       
      handlerwrapper.activity_no_longer_necessary if Thread.current[:nolongernecessary]
      if self.state == :stopping || self.state == :stopped
        handlerwrapper.activity_stop
        wp.passthrough = handlerwrapper.activity_passthrough_value
      end  
      Thread.current[:nolongernecessary] || (self.state == :stopping || self.state == :stopped) ? nil : handlerwrapper.activity_result_value
    end# }}}

    def state=(newState)# {{{
      @__wee_positions = Array.new if @__wee_state != newState && newState == :running
      handlerwrapper = @__wee_handlerwrapper.new @__wee_handlerwrapper_args
      @__wee_state = newState
      handlerwrapper.inform_state_change @__wee_state
      if newState == :stopping
        recursive_continue(@__wee_main)
        recursive_join(@__wee_main)
        @__wee_state = :stopped
        handlerwrapper.inform_state_change @__wee_state
      end
      @__wee_state
    end# }}}

  public
    def positions# {{{
      @__wee_positions
    end# }}}

    # set the handlerwrapper
    def handlerwrapper# {{{
      @__wee_handlerwrapper
    end# }}}
    def handlerwrapper=(new_wee_handlerwrapper)# {{{
      superclass = new_wee_handlerwrapper
      while superclass
        check_ok = true if superclass == Wee::HandlerWrapperBase
        superclass = superclass.superclass
      end
      raise "Handlerwrapper is not inherited from HandlerWrapperBase" unless check_ok
      @__wee_handlerwrapper = new_wee_handlerwrapper
    end# }}}

    # Get/Set the handlerwrapper arguments
    def handlerwrapper_args=(args)# {{{
      if args.class == Array
        @__wee_handlerwrapper_args = args
      end
      nil
    end# }}}
    def handlerwrapper_args# {{{
      @__wee_handlerwrapper_args
    end# }}}

    # Get the state of execution (ready|running|stopping|stopped|finished)
    def state# {{{
      @__wee_state
    end# }}}

    # Set search positions
    # set new_wee_search to a boolean (or anything else) to start the process from beginning (reset serach positions)
    def search(new_wee_search=false)# {{{
      @__wee_search_positions = {}

      new_wee_search = [new_wee_search] if new_wee_search.is_a?(Position)
  
      if !new_wee_search.is_a?(Array) || new_wee_search.empty?
        false
      else  
        new_wee_search.each do |search_position| 
          @__wee_search_positions[search_position.position] = search_position
        end  
        true
      end
    end# }}}

    def context# {{{
      ReadHash.new(@__wee_context)
    end# }}}
    def endpoints# {{{
      ReadHash.new(@__wee_endpoints)
    end# }}}
    
    def raw_context# {{{
      @__wee_context
    end# }}}
    def raw_endpoints# {{{
      @__wee_endpoints
    end# }}}

    # get/set workflow description
    def description(code = nil,&blk)# {{{
      if code.nil? && !block_given?
        @__wee_wfsource
      else
        unless block_given?
          @__wee_wfsource = code
          blk = Proc.new do
            begin 
              instance_eval(@__wee_wfsource)
            rescue => err
              self.state = :stopping
              handlerwrapper = @__wee_handlerwrapper.new @__wee_handlerwrapper_args
              handlerwrapper.inform_syntax_error(err)
            end
          end
        end
        (class << self; self; end).class_eval do
          define_method :__wee_control_flow do
            self.state = :running
            begin 
              instance_eval(&blk)
            rescue => err
              self.state = :stopping
              handlerwrapper = @__wee_handlerwrapper.new @__wee_handlerwrapper_args
              handlerwrapper.inform_syntax_error(err)
            end
            self.state = :finished if self.state == :running
          end
        end
        blk  
      end
    end# }}}

    # Stop the workflow execution
    def stop# {{{
      Thread.new do
        self.state = :stopping
      end  
    end# }}}
    # Start the workflow execution
    def start# {{{
      return nil if self.state == :running
      @__wee_main = Thread.new do
        begin
          __wee_control_flow
        rescue => err
          puts err.message
          puts err.backtrace
        end
      end
    end# }}}

end
