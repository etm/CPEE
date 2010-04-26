require 'thread'

class Wee
  class CHash < Hash# {{{
    def initialize(bndg)
      @bndg = bndg
    end  
    def clear
      self.each do |k,v|
        @bndg.send :remove_instance_variable, "@#{k}".to_sym
      end
      super
    end
    def delete(key)
      if res = super(key)
        @bndg.send :remove_instance_variable, "@#{k}".to_sym
      end
      res
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
    @__wee_search_positions = @__wee_search_positions_original = {}
    @__wee_search = false
    @__wee_positions = Array.new
    @__wee_main = nil
    @__wee_context ||= CHash.new(self)
    @__wee_context_change = true
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

  def self::endpoint(endpoints)# {{{
    @@__wee_new_endpoints ||= {}
    @@__wee_new_endpoints.merge! endpoints
    define_method :initialize_endpoints do
      self.endpoint @@__wee_new_endpoints
    end
  end# }}}

  def self::context(variables)# {{{
    @@__wee_new_context_variables ||= []
    @@__wee_new_context_variables << variables
    define_method :initialize_context do
      @@__wee_new_context_variables.each { |item| self.context item }
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
    def activity(position, type, endpoint=nil, *parameters)# {{{
      position, lay = position_test position
      return if self.state == :stopping || self.state == :stopped || Thread.current[:nolongernecessary] || is_in_search_mode(position)

      Thread.current[:continue] = Continue.new
      handlerwrapper = @__wee_handlerwrapper.new @__wee_handlerwrapper_args, position, lay, Thread.current[:continue]
      @__wee_context_change = false

      wp = Wee::Position.new(position, :at, nil)
      @__wee_positions << wp

      begin
        handlerwrapper.vote_sync_before
        case type
          when :manipulate
            if block_given?
              handlerwrapper.inform_activity_manipulate
              yield
            end  
            refreshcontext handlerwrapper
          when :call
            handlerwrapper.vote_sync_before
            passthrough = @__wee_search_positions[position] ? @__wee_search_positions[position].passthrough : nil
            ret_value = perform_external_call wp, passthrough, handlerwrapper, @__wee_endpoints[endpoint], *parameters
            if block_given? && self.state != :stopping && !Thread.current[:nolongernecessary]
              handlerwrapper.inform_activity_manipulate
              yield ret_value
              refreshcontext handlerwrapper
            end
        end
        if self.state != :stopping && !Thread.current[:nolongernecessary]
          handlerwrapper.inform_activity_done
          handlerwrapper.vote_sync_after
        end
        if self.state != :stopping
          @__wee_positions.delete wp
          handlerwrapper.inform_position_change
        end  
      rescue => err
        refreshcontext handlerwrapper
        handlerwrapper.inform_activity_failed err
        self.state = :stopping
      ensure
        @__wee_context_change = true
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

      wait_count = (type.is_a?(Hash) && type.size == 1 && type[:wait] != nil && type[:wait].is_a?(Integer)) ? type[:wait] : Thread.current[:branches].size
      finished_threads_count = 0

      branch_count = true
      while branch_count
        finished_threads_count = 0
        Thread.current[:branches].each { |thread| finished_threads_count+=1 unless thread.alive? }
        if finished_threads_count < wait_count && finished_threads_count < Thread.current[:branches].size && self.state != :stopping
          Thread.current[:branch_event].join
        else  
          branch_count = false
        end  
      end

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
      parent_thread = Thread.current
      Thread.current[:branches] << Thread.new(*vars) do |*local|
        Thread.current[:branch_search] = @__wee_search
        yield(*local)
        parent_thread[:mutex].synchronize do # enable the while in parallel() to operate without polling
          pte = parent_thread[:branch_event]
          parent_thread[:branch_event] = Thread.new{Thread.stop}
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
      # set semaphore to avoid conflicts if @__wee_search is changed by another thread
      Mutex.new.synchronize do
        branch = Thread.current
        if position && @__wee_search_positions[position] # matching searchpos => start execution from here
          searchpos = @__wee_search_positions[position]
          branch[:branch_search] = false
          @__wee_search = false
          return searchpos.detail == :after
        end
        return branch[:branch_search] || @__wee_search # is activity part of a branch and in search mode?
      end
    end# }}}
    def perform_external_call(wp, passthrough, handlerwrapper, endpoint, *parameters)# {{{
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
      handlerwrapper.activity_handle passthrough, endpoint, params
      Thread.current[:continue].wait unless Thread.current[:nolongernecessary] || self.state == :stopping || self.state == :stopped
       
      handlerwrapper.activity_no_longer_necessary if Thread.current[:nolongernecessary]
      if self.state == :stopping || self.state == :stopped
        handlerwrapper.activity_stop
        wp.passthrough = handlerwrapper.activity_passthrough_value
      end  
      Thread.current[:nolongernecessary] || (self.state == :stopping || self.state == :stopped) ? nil : handlerwrapper.activity_result_value
    end# }}}
    def refreshcontext(handlerwrapper)# {{{
      changed = []
      @__wee_context.each do |varname, value|
        if @__wee_context[varname] != instance_variable_get("@#{varname}".to_sym)
          changed << varname
          @__wee_context[varname] = instance_variable_get("@#{varname}".to_sym)
        end  
      end
      handlerwrapper.inform_context_change(changed) unless changed.empty?
    end# }}}

    def state=(newState)# {{{
      @__wee_positions = Array.new if @__wee_state != newState && newState == :running
      self.search @__wee_search_positions_original
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
    def search(new_wee_search)# {{{
      @__wee_search_positions = {}
      @__wee_search_positions_original = []

      new_wee_search = [new_wee_search] if new_wee_search.is_a?(Position)
  
      if(new_wee_search == false || new_wee_search.empty?)
        @__wee_search_original = false
      else  
        @__wee_search_original = true
        if new_wee_search.is_a?(Array)
          @__wee_search_positions_original = new_wee_search
        else
          @__wee_search_positions_original = [new_wee_search]
        end
        @__wee_search_positions_original.each { |search_position| @__wee_search_positions[search_position.position] = search_position } if @__wee_search_positions_original.is_a?(Array)
      end
      @__wee_search = @__wee_search_original
    end# }}}
    # Get search positions
    def search_positions# {{{
      return @__wee_search_positions_original
    end# }}}

    # get/set/clean context
    def context(new_context = nil)# {{{
      if new_context.nil?
        @__wee_context ? @__wee_context : CHash.new(self)
      else  
        if new_context.is_a?(Hash) || new_context.is_a?(CHash)
          new_context.each do |name, value|
            if @__wee_context_change # during manipulate (or call block) changing the context is not allowed, changes are only written to instance variables
              @__wee_context[name.to_s.to_sym] = value
            else
              @__wee_context[name.to_s.to_sym] = nil
            end  
            self.instance_variable_set("@#{name}".to_sym,value)
          end
        end
      end  
    end# }}}

    # get/set/clean endpoints
    def endpoints(new_endpoints = nil)# {{{
      if new_endpoints.nil?
        @__wee_endpoints ? @__wee_endpoints : Hash.new
      else
        if new_endpoints.is_a?(Hash)
          new_endpoints.each do |name,value|
            @__wee_endpoints["#{name}".to_sym] = value
          end
        end
      end
    end# }}}
    def endpoint(e)# {{{
      self.endpoints e
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
            rescue SyntaxError => err
              self.state = :stopping
              handlerwrapper = @__wee_handlerwrapper.new @__wee_handlerwrapper_args
              handlerwrapper.inform_syntax_error(err)
            end
          end
        end
        (class << self; self; end).class_eval do
          define_method :__wee_control_flow do
            self.state = :running
            instance_eval(&blk)
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
        __wee_control_flow
      end
    end# }}}

end
